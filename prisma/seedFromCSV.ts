import fs from "fs";
import csv from "csv-parser";
import path from "path";
import { prisma } from "./db.setup";
import { calcUnitPrice } from "../src/utils/creation-utils";
import { Brand, Category, Colors, Effects, Prisma } from "@prisma/client";

type ProductCreateData = Omit<Prisma.ProductCreateInput, "id">;
type ProductUpdateData = Omit<Prisma.ProductUpdateInput, "id" | "sku">;

interface BaseProductData {
  title: string;
  inStock: boolean;
  Categories: { connect: { name: Category } };
  Brands: { connect: { name: Brand } };
  package: number[];
  casePrice: Prisma.Decimal;
  EffectStrings?: { connect: { name: Effects }[] };
  ColorStrings?: { connect: { name: Colors }[] };
  description: string | null;
  image: string;
  videoURL: string | null;
  isCaseBreakable: boolean;
  UnitProduct?: {
    create: {
      sku: string;
      availableStock: number;
      unitPrice: Prisma.Decimal;
      package: number[];
    };
  };
}

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

const parsePackage = (packageData: string): number[] => {
  const parsed = packageData
    .replace(/[\[\]{}]/g, "")
    .split(",")
    .map((num) => Math.max(1, Math.floor(Number(num.trim()))))
    .filter((num) => !isNaN(num));

  if (parsed.length < 2) {
    console.warn(`Invalid package data: ${packageData}. Using default [1, 1].`);
    return [1, 1];
  }

  const [first, second] = parsed;

  if (first > 1 && second > 1 && parsed.length > 2) {
    const third = Math.max(1, parsed[2]);
    return [first, second, third];
  }

  return [first, second];
};

const parseCSV = (filePath: string): Promise<CSVRow[]> => {
  return new Promise((resolve, reject) => {
    const results: CSVRow[] = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data: CSVRow) => results.push(trimKeys(data)))
      .on("end", () => resolve(results))
      .on("error", (error) => reject(error));
  });
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

    const parsedPackage = parsePackage(packageData);
    const parsedEffects = effects
      ? effects.split(";").map((effect) => effect.trim() as Effects)
      : [];
    const parsedColors = colors
      ? colors.split(";").map((color) => color.trim() as Colors)
      : [];

    const baseProductData: BaseProductData = {
      title,
      inStock: inStock.toLowerCase() === "true",
      Categories: { connect: { name: category as Category } },
      Brands: { connect: { name: brand as Brand } },
      package: parsedPackage,
      casePrice: new Prisma.Decimal(casePrice),
      EffectStrings: {
        connect: parsedEffects.map((effect) => ({ name: effect })),
      },
      ColorStrings: { connect: parsedColors.map((color) => ({ name: color })) },
      description,
      image,
      videoURL,
      isCaseBreakable: isCaseBreakable.toLowerCase() === "true",
    };

    if (baseProductData.isCaseBreakable) {
      const unitSku = `${sku}-u`;
      const unitPackage = [1, ...parsedPackage.slice(1)];
      baseProductData.UnitProduct = {
        create: {
          sku: unitSku,
          availableStock: 0,
          unitPrice: new Prisma.Decimal(
            calcUnitPrice(parseFloat(casePrice), parsedPackage[0])
          ),
          package: unitPackage,
        },
      };
    }

    const productCreateData: ProductCreateData = {
      sku: parseInt(sku, 10),
      ...baseProductData,
    };

    const productUpdateData: ProductUpdateData = baseProductData;

    await prisma.product.upsert({
      where: { sku: parseInt(sku, 10) },
      update: productUpdateData,
      create: productCreateData,
    });

    return `Successfully processed SKU ${sku}`;
  } catch (error) {
    return `Error processing SKU ${row.sku}: ${(error as Error).message}`;
  }
};

const validateRow = (row: CSVRow): boolean => {
  if (!row.sku || !row.title || !row.package || !row.casePrice) {
    console.warn(`Invalid row data: ${JSON.stringify(row)}`);
    return false;
  }
  return true;
};

const processCSVData = async (csvData: CSVRow[]) => {
  const results: string[] = [];
  for (const row of csvData) {
    if (!validateRow(row)) {
      results.push(`Skipped invalid row: SKU ${row.sku}`);
      continue;
    }
    try {
      const result = await createOrUpdateProductFromRow(row);
      results.push(result);
    } catch (error) {
      console.error(`Error processing row:`, row, error);
      results.push(
        `Error processing SKU ${row.sku}: ${(error as Error).message}`
      );
    }
  }
  return results;
};

const seedDbFromCSV = async (filePath: string) => {
  try {
    console.log("Starting DB Seeding from CSV");
    const csvData = await parseCSV(filePath);
    console.log(`Successfully parsed CSV. Row count: ${csvData.length}`);

    const results = await processCSVData(csvData);

    const successCount = results.filter((r) =>
      r.startsWith("Successfully")
    ).length;
    const errorCount = results.filter((r) => r.startsWith("Error")).length;

    console.log(
      `Seeding Complete. Successful: ${successCount}, Errors: ${errorCount}`
    );

    // Log errors to a file
    if (errorCount > 0) {
      const errorLog = results.filter((r) => r.startsWith("Error")).join("\n");
      fs.writeFileSync("seed_errors.log", errorLog);
      console.log("Errors have been logged to seed_errors.log");
    }
  } catch (error) {
    console.error("Error seeding DB from CSV:", error);
  } finally {
    await prisma.$disconnect();
  }
};

const csvFilePath = path.resolve(__dirname, "products.csv");
seedDbFromCSV(csvFilePath);
