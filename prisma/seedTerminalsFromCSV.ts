import fs from "fs";
import csv from "csv-parser";
import path from "path";
import { prisma } from "./db.setup";
import { State, TerminalCompany } from "@prisma/client";
import {
  printProgressBar,
  startSpinner,
  stopSpinner,
  printSection,
  cleanup,
} from "./utils/progress-utils";
import { validateTerminalRow, validateBoolean } from "./utils/validation-utils";

interface CSVRow {
  acceptOutOfStateLicence: string;
  terminalName: string;
  businessRequired: string;
  street1: string;
  street2: string;
  city: string;
  state: string;
  postalCode: string;
  company: string;
}

interface TerminalData {
  acceptOutOfStateLicence: boolean;
  terminalName: string;
  businessRequired: boolean;
  address: {
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

const createTerminal = async (
  row: CSVRow
): Promise<{ success: boolean; message: string }> => {
  try {
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

    // Validate boolean values
    const acceptResult = validateBoolean(
      acceptOutOfStateLicence,
      "Accept Out Of State Licence"
    );
    if (!acceptResult.valid) {
      return { success: false, message: acceptResult.error! };
    }

    const businessRequiredResult = validateBoolean(
      businessRequired,
      "Business Required"
    );
    if (!businessRequiredResult.valid) {
      return { success: false, message: businessRequiredResult.error! };
    }

    // Create the address first
    const address = await prisma.address.create({
      data: {
        street1,
        street2: street2 || undefined,
        city,
        state: state as State,
        postalCode,
      },
    });

    // Create the terminal with the address
    await prisma.approvedTerminals.create({
      data: {
        acceptOutOfStateLicence: acceptResult.value!,
        terminalName,
        businessRequired: businessRequiredResult.value!,
        addressId: address.id,
        company: company as TerminalCompany,
      },
    });

    return {
      success: true,
      message: `Created terminal: ${terminalName} (${city}, ${state})`,
    };
  } catch (error) {
    return {
      success: false,
      message: `Error creating terminal ${row.terminalName}: ${
        (error as Error).message
      }`,
    };
  }
};

const deleteExistingTerminals = async (): Promise<void> => {
  try {
    startSpinner("Fetching existing terminals");

    // First get all terminal records to find their address IDs
    const terminals = await prisma.approvedTerminals.findMany({
      select: { addressId: true },
    });

    const addressIds = terminals.map((t) => t.addressId);

    stopSpinner(`Found ${terminals.length} existing terminals`);

    // Delete terminals first (due to foreign key constraints)
    if (terminals.length > 0) {
      startSpinner("Deleting existing terminals");
      await prisma.approvedTerminals.deleteMany();
      stopSpinner(`Deleted ${terminals.length} existing terminals`);
    } else {
      console.log("No existing terminals to delete");
    }

    // Then delete associated addresses
    if (addressIds.length > 0) {
      startSpinner(`Deleting ${addressIds.length} associated addresses`);

      // Delete in batches to avoid "too many parameters" error
      const batchSize = 100;
      let deletedCount = 0;

      for (let i = 0; i < addressIds.length; i += batchSize) {
        const batch = addressIds.slice(i, i + batchSize);
        await prisma.address.deleteMany({
          where: {
            id: { in: batch },
          },
        });

        deletedCount += batch.length;
        if (addressIds.length > batchSize) {
          printProgressBar(deletedCount, addressIds.length);
        }
      }

      if (addressIds.length > batchSize) {
        console.log(""); // New line after progress bar
      }

      stopSpinner(`Deleted ${addressIds.length} addresses`);
    } else {
      console.log("No addresses to delete");
    }

    console.log(
      "All existing terminals and their addresses deleted successfully"
    );
  } catch (error) {
    stopSpinner();
    console.error("Error deleting existing terminals:", error);
    throw error;
  }
};

const processTerminals = async (csvData: CSVRow[]) => {
  // Get valid states and companies for validation
  const validStates = Object.values(State);
  const validCompanies = Object.values(TerminalCompany);

  printSection("Validating terminal records");

  const validTerminals: CSVRow[] = [];
  const invalidTerminals: {
    row: CSVRow;
    errors: { [field: string]: string };
  }[] = [];

  // Validate all terminals first
  for (let i = 0; i < csvData.length; i++) {
    const row = csvData[i];
    const { valid, errors } = validateTerminalRow(
      row,
      validStates,
      validCompanies
    );

    if (valid) {
      validTerminals.push(row);
    } else {
      invalidTerminals.push({ row, errors });
    }

    printProgressBar(i + 1, csvData.length);
  }

  console.log(""); // New line after progress bar
  console.log(
    `Validation complete: ${validTerminals.length} valid terminals, ${invalidTerminals.length} invalid terminals`
  );

  // Report invalid terminals
  if (invalidTerminals.length > 0) {
    console.log("\nInvalid terminals:");
    invalidTerminals.forEach(({ row, errors }) => {
      console.log(
        `- Terminal "${row.terminalName}" (${row.city}, ${row.state}):`
      );
      Object.entries(errors).forEach(([field, error]) => {
        console.log(`  * ${field}: ${error}`);
      });
    });

    const invalidLog = invalidTerminals
      .map(({ row, errors }) => {
        return `Terminal "${row.terminalName}" (${row.city}, ${
          row.state
        }): ${Object.values(errors).join(", ")}`;
      })
      .join("\n");

    fs.writeFileSync("error_logs/invalid_terminals.log", invalidLog);
    console.log(
      "\nInvalid terminals have been logged to invalid_terminals.log"
    );
  }

  // Process valid terminals
  if (validTerminals.length > 0) {
    printSection(`Processing ${validTerminals.length} valid terminals`);

    const results = {
      success: 0,
      failed: 0,
      details: [] as { success: boolean; message: string }[],
    };

    let processed = 0;

    for (const row of validTerminals) {
      const result = await createTerminal(row);

      if (result.success) {
        results.success++;
      } else {
        results.failed++;
      }

      results.details.push(result);
      processed++;

      printProgressBar(processed, validTerminals.length);
    }

    console.log("\n");

    return results;
  }

  return { success: 0, failed: 0, details: [] };
};

const seedTerminalsFromCSV = async (filePath: string) => {
  try {
    printSection("Starting Terminal DB Seeding from CSV");

    const csvData = await parseCSV(filePath);

    await deleteExistingTerminals();

    const results = await processTerminals(csvData);

    printSection("Terminal Seeding Results");
    console.log(`Total Processed: ${results.success + results.failed}`);
    console.log(`Successfully Created: ${results.success}`);
    console.log(`Failed: ${results.failed}`);

    // Log failed terminals
    if (results.failed > 0) {
      console.log("\nFailed terminals:");
      results.details
        .filter((r) => !r.success)
        .forEach((r) => console.log(`- ${r.message}`));

      // Write detailed error log
      const errorLog = results.details
        .filter((r) => !r.success)
        .map((r) => r.message)
        .join("\n");

      fs.writeFileSync("terminal_seed_errors.log", errorLog);
      console.log("\nErrors have been logged to terminal_seed_errors.log");
    }

    printSection("Terminal Seeding Process Complete!");
  } catch (error) {
    console.error("Error seeding terminals from CSV:", error);
  } finally {
    cleanup();
    await prisma.$disconnect();
  }
};

if (require.main === module) {
  const csvFilePath = path.resolve(__dirname, "terminals.csv");
  seedTerminalsFromCSV(csvFilePath);
}

export { seedTerminalsFromCSV };
