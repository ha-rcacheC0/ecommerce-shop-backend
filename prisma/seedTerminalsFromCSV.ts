import fs from "fs";
import csv from "csv-parser";
import path from "path";
import { prisma } from "./db.setup";
import { State, TerminalCompany } from "@prisma/client";

interface CSVRow {
  acceptOutOfStateLicence: string;
  terminalName: string;
  businessRequired: string;
  street1: string;
  street2: string;
  city: string;
  state: State;
  postalCode: string;
  company: TerminalCompany;
}

interface TerminalData {
  acceptOutOfStateLicence: boolean;
  terminalName: string;
  businessRequired: boolean;
  Address: {
    create: {
      street1: string;
      street2?: string;
      city: string;
      state: State;
      postalCode: string;
    };
  };
  company: TerminalCompany;
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

const createTerminalsFromCSV = async (csvData: CSVRow[]) => {
  await prisma.approvedTerminals.deleteMany();
  await prisma.address.deleteMany();

  for (const row of csvData) {
    const {
      acceptOutOfStateLicence,
      terminalName,
      businessRequired,
      street1,
      street2,
      city,
      state,
      postalCode,
      company,
    } = row;

    const terminalData: TerminalData = {
      acceptOutOfStateLicence: acceptOutOfStateLicence.toLowerCase() === "true",
      terminalName,
      businessRequired: businessRequired.toLowerCase() === "true",
      Address: {
        create: {
          street1,
          street2: street2 || undefined,
          city,
          state,
          postalCode,
        },
      },
      company,
    };

    await prisma.approvedTerminals.create({ data: terminalData });
  }
};

const seedDbFromCSV = async (filePath: string) => {
  try {
    console.log("Starting DB Seeding from CSV");
    const csvData = await parseCSV(filePath);
    await createTerminalsFromCSV(csvData);
    console.log("Seeding Complete");
  } catch (error) {
    console.error("Error seeding DB from CSV:", error);
  } finally {
    await prisma.$disconnect();
  }
};

const csvFilePath = path.resolve(__dirname, "terminals.csv");
seedDbFromCSV(csvFilePath);
