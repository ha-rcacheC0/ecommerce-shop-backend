/**
 * Data validation utilities for CSV imports
 * Provides functions to validate and sanitize data from CSV files
 */

/**
 * Validates and parses a delimited string (colors, effects, etc.)
 * @param valueStr The string to parse (e.g., "RED;BLUE;GREEN")
 * @param delimiter The delimiter character (default is semicolon)
 * @param allowEmpty Whether to allow empty values
 * @returns Object with validation result and parsed values or error message
 */
export function parseDelimitedValue(
  valueStr: string | undefined,
  delimiter: string = ";",
  allowEmpty: boolean = false
): {
  valid: boolean;
  values?: string[];
  error?: string;
} {
  // Handle undefined or empty cases
  if (!valueStr) {
    return allowEmpty
      ? { valid: true, values: [] }
      : { valid: false, error: "Value is empty" };
  }

  // Trim whitespace
  const trimmedValue = valueStr.trim();
  if (trimmedValue === "") {
    return allowEmpty
      ? { valid: true, values: [] }
      : { valid: false, error: "Value is empty" };
  }

  // Check for incorrect separators
  const commonSeparators = [";", ",", ":", "|"];
  const usedDelimiters = commonSeparators.filter(
    (sep) => sep !== delimiter && trimmedValue.includes(sep)
  );

  if (usedDelimiters.length > 0) {
    return {
      valid: false,
      error: `Possible incorrect delimiter: found "${usedDelimiters[0]}" but expected "${delimiter}"`,
    };
  }

  // Split and process values
  const values = trimmedValue
    .split(delimiter)
    .map((v) => v.trim())
    .filter((v) => v !== "");

  // Validate we have actual values
  if (values.length === 0 && !allowEmpty) {
    return { valid: false, error: "No valid values found after splitting" };
  }

  return { valid: true, values };
}

/**
 * Validates product package data from CSV
 * @param packageData Package data string (e.g., "[1,4]", "1,4", etc.)
 * @returns Object with validation result and parsed values or error message
 */
export function validatePackage(packageData: string): {
  valid: boolean;
  values?: number[];
  error?: string;
} {
  if (!packageData || packageData.trim() === "") {
    return { valid: false, error: "Package data is empty" };
  }

  // Remove brackets, braces, etc.
  const sanitized = packageData.replace(/[\[\]{}()]/g, "").trim();

  // Split by commas
  const parts = sanitized.split(",").map((p) => p.trim());

  // Convert to numbers and validate
  const numbers = parts.map((p) => Number(p));

  if (numbers.some(isNaN)) {
    return {
      valid: false,
      error: `Package contains non-numeric values: ${packageData}`,
    };
  }

  if (numbers.some((n) => n <= 0)) {
    return {
      valid: false,
      error: `Package contains zero or negative values: ${packageData}`,
    };
  }

  if (numbers.length < 2) {
    return {
      valid: false,
      error: `Package must contain at least 2 numbers: ${packageData}`,
    };
  }

  // Ensure all numbers are integers
  const integers = numbers.map((n) => Math.floor(n));

  return { valid: true, values: integers };
}

/**
 * Validates string boolean values (true/false, yes/no, 1/0)
 * @param value The string value to parse
 * @param fieldName Name of the field for error messages
 * @returns Object with validation result and parsed boolean or error message
 */
export function validateBoolean(
  value: string,
  fieldName: string = "Value"
): {
  valid: boolean;
  value?: boolean;
  error?: string;
} {
  if (value === undefined || value === null) {
    return { valid: false, error: `${fieldName} is undefined` };
  }

  const trimmedValue = String(value).trim().toLowerCase();

  if (trimmedValue === "") {
    return { valid: false, error: `${fieldName} is empty` };
  }

  // True values
  if (["true", "yes", "1", "y", "on"].includes(trimmedValue)) {
    return { valid: true, value: true };
  }

  // False values
  if (["false", "no", "0", "n", "off"].includes(trimmedValue)) {
    return { valid: true, value: false };
  }

  return {
    valid: false,
    error: `${fieldName} has invalid boolean value: "${value}" (expected true/false, yes/no, 1/0)`,
  };
}

/**
 * Validates decimal values like prices
 * @param value The string value to parse
 * @param fieldName Name of the field for error messages
 * @returns Object with validation result and parsed number or error message
 */
export function validateDecimal(
  value: string,
  fieldName: string = "Value"
): {
  valid: boolean;
  value?: number;
  error?: string;
} {
  if (value === undefined || value === null) {
    return { valid: false, error: `${fieldName} is undefined` };
  }

  const trimmedValue = String(value).trim();

  if (trimmedValue === "") {
    return { valid: false, error: `${fieldName} is empty` };
  }

  // Parse as float and validate
  const numberValue = parseFloat(trimmedValue);

  if (isNaN(numberValue)) {
    return {
      valid: false,
      error: `${fieldName} is not a valid number: "${value}"`,
    };
  }

  if (numberValue < 0) {
    return {
      valid: false,
      error: `${fieldName} cannot be negative: ${numberValue}`,
    };
  }

  return { valid: true, value: numberValue };
}

/**
 * Validates integer values like SKUs
 * @param value The string value to parse
 * @param fieldName Name of the field for error messages
 * @returns Object with validation result and parsed integer or error message
 */
export function validateInteger(
  value: string,
  fieldName: string = "Value"
): {
  valid: boolean;
  value?: number;
  error?: string;
} {
  const decimalResult = validateDecimal(value, fieldName);

  if (!decimalResult.valid) {
    return decimalResult;
  }

  const intValue = Math.floor(decimalResult.value!);

  if (intValue !== decimalResult.value) {
    return {
      valid: false,
      error: `${fieldName} must be an integer: ${value}`,
    };
  }

  return { valid: true, value: intValue };
}

/**
 * Validates that a required field exists and is not empty
 * @param value The value to check
 * @param fieldName Name of the field for error messages
 * @returns Object with validation result or error message
 */
export function validateRequired(
  value: any,
  fieldName: string
): {
  valid: boolean;
  error?: string;
} {
  if (value === undefined || value === null) {
    return { valid: false, error: `Required field "${fieldName}" is missing` };
  }

  if (typeof value === "string" && value.trim() === "") {
    return { valid: false, error: `Required field "${fieldName}" is empty` };
  }

  return { valid: true };
}

/**
 * Validates a row from the products CSV
 * @param row The CSV row to validate
 * @returns Object with validation result and optional errors by field
 */
export function validateProductRow(row: any): {
  valid: boolean;
  errors: { [field: string]: string };
} {
  const errors: { [field: string]: string } = {};

  // Required fields
  const requiredFields = ["sku", "title", "package", "casePrice"];
  for (const field of requiredFields) {
    const result = validateRequired(row[field], field);
    if (!result.valid) {
      errors[field] = result.error!;
    }
  }

  // SKU validation
  if (!errors["sku"]) {
    const skuResult = validateInteger(row.sku, "SKU");
    if (!skuResult.valid) {
      errors["sku"] = skuResult.error!;
    }
  }

  // Package validation
  if (!errors["package"]) {
    const packageResult = validatePackage(row.package);
    if (!packageResult.valid) {
      errors["package"] = packageResult.error!;
    }
  }

  // Price validation
  if (!errors["casePrice"]) {
    const priceResult = validateDecimal(row.casePrice, "Case Price");
    if (!priceResult.valid) {
      errors["casePrice"] = priceResult.error!;
    }
  }

  // Boolean validations
  const booleanFields = [
    { field: "inStock", name: "In Stock" },
    { field: "isCaseBreakable", name: "Is Case Breakable" },
  ];

  for (const { field, name } of booleanFields) {
    if (row[field] !== undefined) {
      const result = validateBoolean(row[field], name);
      if (!result.valid) {
        errors[field] = result.error!;
      }
    }
  }

  // Delimited values validations
  if (row.effects !== undefined) {
    const effectsResult = parseDelimitedValue(row.effects, ";", true);
    if (!effectsResult.valid) {
      errors["effects"] = effectsResult.error!;
    }
  }

  if (row.colors !== undefined) {
    const colorsResult = parseDelimitedValue(row.colors, ";", true);
    if (!colorsResult.valid) {
      errors["colors"] = colorsResult.error!;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates a row from the terminals CSV
 * @param row The CSV row to validate
 * @param validStates Array of valid state values
 * @param validCompanies Array of valid company values
 * @returns Object with validation result and optional errors by field
 */
export function validateTerminalRow(
  row: any,
  validStates: string[],
  validCompanies: string[]
): {
  valid: boolean;
  errors: { [field: string]: string };
} {
  const errors: { [field: string]: string } = {};

  // Required fields
  const requiredFields = [
    "terminalName",
    "street1",
    "city",
    "state",
    "postalCode",
    "company",
  ];

  for (const field of requiredFields) {
    const result = validateRequired(row[field], field);
    if (!result.valid) {
      errors[field] = result.error!;
    }
  }

  // State validation
  if (!errors["state"] && !validStates.includes(row.state)) {
    errors["state"] = `Invalid state: ${
      row.state
    }. Must be one of: ${validStates.join(", ")}`;
  }

  // Company validation
  if (!errors["company"] && !validCompanies.includes(row.company)) {
    errors["company"] = `Invalid company: ${
      row.company
    }. Must be one of: ${validCompanies.join(", ")}`;
  }

  // Boolean validations
  const booleanFields = [
    { field: "acceptOutOfStateLicence", name: "Accept Out Of State Licence" },
    { field: "businessRequired", name: "Business Required" },
  ];

  for (const { field, name } of booleanFields) {
    if (row[field] !== undefined) {
      const result = validateBoolean(row[field], name);
      if (!result.valid) {
        errors[field] = result.error!;
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
