import fs from "fs";
import csv from "csv-parser";
import path from "path";
import { prisma } from "./db.setup";
import { calcUnitPrice } from "../src/utils/creation-utils";

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

interface ProductData {
  sku: number;
  title: string;
  inStock: boolean;
  Categories: {
    connect: { name: string };
  };
  Brands: {
    connect: { name: string };
  };
  package: number[];
  casePrice: number;
  EffectStrings: {
    connect: { name: string }[];
  };
  ColorStrings: {
    connect: { name: string }[];
  };
  description: string;
  image: string;
  videoURL: string;
  isCaseBreakable: boolean;
  UnitProduct?: {
    create: {
      sku: string;
      availableStock: number;
      unitPrice: number;
      package: number[];
    };
  };
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
    const results: CSVRow[] = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data: CSVRow) => results.push(trimKeys(data)))
      .on("end", () => resolve(results))
      .on("error", (error) => reject(error));
  });
};

const createProductsFromCSV = async (csvData: CSVRow[]) => {
  await prisma.unitProduct.deleteMany();
  await prisma.product.deleteMany();

  for (const row of csvData) {
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

    const parsedPackage = JSON.parse(packageData);
    const parsedEffects = effects
      ? effects.split(";").map((effect) => effect.trim())
      : [];
    const parsedColors = colors
      ? colors.split(";").map((color) => color.trim())
      : [];

    const productData: ProductData = {
      sku: parseInt(sku, 10),
      title,
      inStock: inStock.toLowerCase() === "true",
      Categories: {
        connect: { name: category },
      },
      Brands: {
        connect: { name: brand },
      },
      package: parsedPackage,
      casePrice: parseFloat(casePrice),
      EffectStrings: {
        connect: parsedEffects.map((effect) => ({ name: effect })),
      },
      ColorStrings: {
        connect: parsedColors.map((color) => ({ name: color })),
      },
      description,
      image,
      videoURL,
      isCaseBreakable: isCaseBreakable.toLowerCase() === "true",
    };

    if (productData.isCaseBreakable) {
      const unitSku = `${sku}-u`;
      const unitPackage = [1];
      if (parsedPackage.length > 2) {
        unitPackage.push(parsedPackage[1], parsedPackage[2]);
      } else {
        unitPackage.push(parsedPackage[1]);
      }

      productData.UnitProduct = {
        create: {
          sku: unitSku,
          availableStock: 0,
          unitPrice: calcUnitPrice(parseFloat(casePrice), parsedPackage[0]),
          package: unitPackage,
        },
      };
    }

    await prisma.product.create({ data: productData as any });
  }
};

const seedDbFromCSV = async (filePath: string) => {
  try {
    console.log("Starting DB Seeding from CSV");
    const csvData = await parseCSV(filePath);
    await createProductsFromCSV(csvData);
    console.log("Seeding Complete");
  } catch (error) {
    console.error("Error seeding DB from CSV:", error);
  } finally {
    await prisma.$disconnect();
  }
};

const csvFilePath = path.resolve(__dirname, "testProducts.csv");
seedDbFromCSV(csvFilePath);
