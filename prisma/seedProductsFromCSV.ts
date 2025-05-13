import fs from "fs";
import csv from "csv-parser";
import path from "path";

import { calcUnitPrice } from "../src/utils/creation-utils";
import { Prisma, PrismaClient } from "@prisma/client";
import {
  printProgressBar,
  startSpinner,
  stopSpinner,
  printSection,
  cleanup,
} from "./utils/progress-utils";
import {
  validateProductRow,
  parseDelimitedValue,
  validatePackage,
} from "./utils/validation-utils";
import { env } from "../src/env";

type ProductCreateData = Prisma.ProductCreateInput;
type ProductUpdateData = Prisma.ProductUpdateInput;

const prisma = new PrismaClient({
  datasourceUrl: env.DATABASE_URL,
});

interface CSVRow {
  sku: string;
  title: string;
  inStock: string;
  category: string;
  brand: string;
  package: string;
  casePrice: string;
  effects: string;
  colors: string;
  description: string;
  image: string;
  videoURL: string;
  isCaseBreakable: string;
}

const trimKeys = (obj: any): any => {
  const trimmedObj: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      trimmedObj[key.trim()] = obj[key];
    }
  }
  return trimmedObj;
};

const parseCSV = (filePath: string): Promise<CSVRow[]> => {
  return new Promise((resolve, reject) => {
    startSpinner("Reading CSV file");

    const results: CSVRow[] = [];
    let rowCount = 0;

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data: CSVRow) => {
        results.push(trimKeys(data));
        rowCount++;
        if (rowCount % 10 === 0) {
          stopSpinner();
          startSpinner(`Reading CSV file (${rowCount} rows)`);
        }
      })
      .on("end", () => {
        stopSpinner(`CSV file read successfully! Found ${results.length} rows`);
        resolve(results);
      })
      .on("error", (error) => {
        stopSpinner(`Error reading CSV: ${error.message}`);
        reject(error);
      });
  });
};

// Track new entities created
const trackNewEntities = {
  brands: new Set<string>(),
  categories: new Set<string>(),
  colors: new Set<string>(),
  effects: new Set<string>(),
};

const createOrUpdateProductFromRow = async (row: CSVRow): Promise<string> => {
  try {
    const {
      sku,
      title,
      inStock,
      category,
      brand,
      package: packageData,
      casePrice,
      effects,
      colors,
      description,
      image,
      videoURL,
      isCaseBreakable,
    } = row;

    // Use the new validation helpers
    const packageResult = validatePackage(packageData);
    if (!packageResult.valid) {
      return `Error processing SKU ${sku}: ${packageResult.error}`;
    }
    const parsedPackage = packageResult.values!;

    // Parse effects with improved validation
    const effectsResult = parseDelimitedValue(effects, ";", true);
    if (!effectsResult.valid) {
      return `Error processing SKU ${sku}: ${effectsResult.error}`;
    }
    const parsedEffects = effectsResult.values || [];

    // Parse colors with improved validation
    const colorsResult = parseDelimitedValue(colors, ";", true);
    if (!colorsResult.valid) {
      return `Error processing SKU ${sku}: ${colorsResult.error}`;
    }
    const parsedColors = colorsResult.values || [];

    // Find or create the brand
    let brandEntity = await prisma.brand.findFirst({
      where: { name: brand },
    });

    if (!brandEntity) {
      brandEntity = await prisma.brand.create({
        data: { name: brand },
      });
      trackNewEntities.brands.add(brand);
    }

    // Find or create the category
    let categoryEntity = await prisma.category.findFirst({
      where: { name: category },
    });

    if (!categoryEntity) {
      categoryEntity = await prisma.category.create({
        data: { name: category },
      });
      trackNewEntities.categories.add(category);
    }

    // Process colors - find or create each
    const colorConnections = [];
    for (const colorName of parsedColors) {
      let colorEntity = await prisma.color.findFirst({
        where: { name: colorName },
      });

      if (!colorEntity) {
        colorEntity = await prisma.color.create({
          data: { name: colorName },
        });
        trackNewEntities.colors.add(colorName);
      }

      colorConnections.push({ id: colorEntity.id });
    }

    // Process effects - find or create each
    const effectConnections = [];
    for (const effectName of parsedEffects) {
      let effectEntity = await prisma.effect.findFirst({
        where: { name: effectName },
      });

      if (!effectEntity) {
        effectEntity = await prisma.effect.create({
          data: { name: effectName },
        });
        trackNewEntities.effects.add(effectName);
      }

      effectConnections.push({ id: effectEntity.id });
    }

    // Define the base product data
    const isParsedIsCaseBreakable = isCaseBreakable.toLowerCase() === "true";

    const productData: ProductCreateData = {
      sku: sku,
      title,
      inStock: inStock.toLowerCase() === "true",
      package: parsedPackage,
      casePrice: new Prisma.Decimal(casePrice),
      description: description || null,
      image: image || "placeholder",
      videoURL: videoURL || null,
      isCaseBreakable: isParsedIsCaseBreakable,
      brand: {
        connect: { id: brandEntity.id },
      },
      category: {
        connect: { id: categoryEntity.id },
      },
      colors: {
        connect: colorConnections,
      },
      effects: {
        connect: effectConnections,
      },
    };

    // Add unit product if case is breakable
    if (isParsedIsCaseBreakable) {
      const unitPackage = [1, ...parsedPackage.slice(1)];
      const unitPrice = calcUnitPrice(parseFloat(casePrice), parsedPackage[0]);

      productData.unitProduct = {
        create: {
          sku: `${sku}-u`,
          availableStock: 0,
          unitPrice: new Prisma.Decimal(unitPrice),
          package: unitPackage,
        },
      };
    }

    // Check if product already exists
    const existingProduct = await prisma.product.findUnique({
      where: { sku: sku },
      include: {
        unitProduct: true,
      },
    });

    if (existingProduct) {
      // Update existing product
      const updateData: ProductUpdateData = { ...productData };

      // Remove the unitProduct create directive if we're updating
      if (updateData.unitProduct) {
        delete updateData.unitProduct;
      }

      // Update the base product
      await prisma.product.update({
        where: { id: existingProduct.id },
        data: updateData,
      });

      // Handle unit product separately - upsert if case breakable, delete if not
      if (isParsedIsCaseBreakable) {
        if (existingProduct.unitProduct) {
          // Update existing unit product
          await prisma.unitProduct.update({
            where: { id: existingProduct.unitProduct.id },
            data: {
              unitPrice: new Prisma.Decimal(
                calcUnitPrice(parseFloat(casePrice), parsedPackage[0])
              ),
              package: [1, ...parsedPackage.slice(1)],
            },
          });
        } else {
          // Create new unit product
          await prisma.unitProduct.create({
            data: {
              sku: `${sku}-u`,
              productId: existingProduct.id,
              unitPrice: new Prisma.Decimal(
                calcUnitPrice(parseFloat(casePrice), parsedPackage[0])
              ),
              package: [1, ...parsedPackage.slice(1)],
              availableStock: 0,
            },
          });
        }
      } else if (existingProduct.unitProduct && !isParsedIsCaseBreakable) {
        // Delete unit product if no longer breakable
        await prisma.unitProduct.delete({
          where: { id: existingProduct.unitProduct.id },
        });
      }

      return `Updated product SKU ${sku} (${title})`;
    } else {
      // Create new product
      await prisma.product.create({
        data: productData,
      });

      return `Created product SKU ${sku} (${title})`;
    }
  } catch (error) {
    console.error(`Error processing SKU ${row.sku}:`, error);
    return `Error processing SKU ${row.sku}: ${(error as Error).message}`;
  }
};

const processCSVData = async (csvData: CSVRow[]) => {
  const results: string[] = [];
  let processed = 0;
  const validRows: CSVRow[] = [];
  const invalidRows: { row: CSVRow; errors: { [field: string]: string } }[] =
    [];

  // Validate all rows first
  printSection("Validating CSV data");

  let validCount = 0;
  let invalidCount = 0;

  for (const row of csvData) {
    const validation = validateProductRow(row);

    if (validation.valid) {
      validRows.push(row);
      validCount++;
    } else {
      invalidRows.push({ row, errors: validation.errors });
      invalidCount++;
    }

    // Update progress every 10 rows
    if (
      (validCount + invalidCount) % 10 === 0 ||
      validCount + invalidCount === csvData.length
    ) {
      printProgressBar(validCount + invalidCount, csvData.length);
    }
  }

  console.log("\n"); // New line after progress bar
  console.log(
    `Validation complete: ${validCount} valid rows, ${invalidCount} invalid rows`
  );

  // Report invalid rows
  if (invalidRows.length > 0) {
    console.log("\nInvalid rows:");
    invalidRows.forEach(({ row, errors }) => {
      console.log(`- Product SKU ${row.sku} (${row.title}):`);
      Object.entries(errors).forEach(([field, error]) => {
        console.log(`  * ${field}: ${error}`);
      });
      results.push(
        `Skipped invalid row: SKU ${row.sku} - ${Object.values(errors).join(
          ", "
        )}`
      );
    });
  }

  // Process valid rows
  if (validRows.length > 0) {
    printSection("Processing products");

    for (const row of validRows) {
      try {
        const result = await createOrUpdateProductFromRow(row);
        results.push(result);
        processed++;
        printProgressBar(processed, validRows.length);
      } catch (error) {
        console.error(`Error processing row:`, row, error);
        results.push(
          `Error processing SKU ${row.sku}: ${(error as Error).message}`
        );
      }
    }

    console.log("\n"); // New line after progress bar
  }

  return results;
};

const seedDbFromCSV = async (filePath: string) => {
  try {
    printSection("Connected to DB");
    const dbUrlParts = (process.env.DATABASE_URL as string).split("@");
    const maskedUrl =
      dbUrlParts.length > 1
        ? `[credentials-hidden]@${dbUrlParts[1]}`
        : "[formatted-db-url-hidden]";
    console.log(`Using database: ${maskedUrl}`);
    printSection("Starting Product DB Seeding from CSV");

    const csvData = await parseCSV(filePath);
    console.log(`CSV file loaded with ${csvData.length} products`);

    const results = await processCSVData(csvData);

    const successCount = results.filter(
      (r) => r.startsWith("Created") || r.startsWith("Updated")
    ).length;
    const createCount = results.filter((r) => r.startsWith("Created")).length;
    const updateCount = results.filter((r) => r.startsWith("Updated")).length;
    const errorCount = results.filter((r) => r.startsWith("Error")).length;
    const skipCount = results.filter((r) => r.startsWith("Skipped")).length;

    printSection("CSV Processing Results");
    console.log(`Total Processed: ${results.length}`);
    console.log(`Successes: ${successCount}`);
    console.log(`  - Created: ${createCount}`);
    console.log(`  - Updated: ${updateCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log(`Skipped: ${skipCount}`);

    // Report on new entities created
    printSection("New Entities Created");
    console.log(`New Brands: ${trackNewEntities.brands.size}`);
    if (trackNewEntities.brands.size > 0) {
      console.log(`  - ${Array.from(trackNewEntities.brands).join(", ")}`);
    }

    console.log(`New Categories: ${trackNewEntities.categories.size}`);
    if (trackNewEntities.categories.size > 0) {
      console.log(`  - ${Array.from(trackNewEntities.categories).join(", ")}`);
    }

    console.log(`New Colors: ${trackNewEntities.colors.size}`);
    if (trackNewEntities.colors.size > 0) {
      console.log(`  - ${Array.from(trackNewEntities.colors).join(", ")}`);
    }

    console.log(`New Effects: ${trackNewEntities.effects.size}`);
    if (trackNewEntities.effects.size > 0) {
      console.log(`  - ${Array.from(trackNewEntities.effects).join(", ")}`);
    }

    // Log errors to a file
    if (errorCount > 0) {
      const errorLog = results.filter((r) => r.startsWith("Error")).join("\n");
      const errorLogPath = path.resolve(
        process.cwd(),
        "error_logs/seed_products_error.log"
      );
      fs.writeFileSync(errorLogPath, errorLog);
      console.log("\nErrors have been logged to seed_errors.log");
    }

    // Log skipped rows to a file
    if (skipCount > 0) {
      const skippedLog = results
        .filter((r) => r.startsWith("Skipped"))
        .join("\n");
      const skipLogPath = path.resolve(
        process.cwd(),
        "error_logs/skipped_rows.log"
      );
      fs.writeFileSync(skipLogPath, skippedLog);
      console.log("\nSkipped rows have been logged to skipped_rows.log");
    }

    printSection("CSV Seeding Process Complete!");
  } catch (error) {
    console.error("Error seeding DB from CSV:", error);
  } finally {
    // Make sure we clean up
    cleanup();
    await prisma.$disconnect();
  }
};

// Use this if you want to run the script directly
if (require.main === module) {
  const csvFilePath = path.resolve(__dirname, "products.csv");
  seedDbFromCSV(csvFilePath);
}

// Export for programmatic use
export { seedDbFromCSV };
