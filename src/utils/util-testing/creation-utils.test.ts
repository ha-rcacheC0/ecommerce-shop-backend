import { calcUnitPrice } from "../creation-utils";

// Test cases
const testCases = [
  { casePrice: 100, qty: 10, expected: 14.99 },
  { casePrice: 153, qty: 20, expected: 10.99 },
  { casePrice: 200, qty: 25, expected: 11.99 },
];

testCases.forEach((test, index) => {
  const result = calcUnitPrice(test.casePrice, test.qty);
  console.log(
    `Test Case ${index + 1}: ${result === test.expected ? "Passed" : "Failed"}`
  );
  console.log(`Expected: ${test.expected}, Got: ${result}`);
});
