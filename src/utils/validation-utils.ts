import { z } from "zod";

export const productSchema = z.object({
  productID: z.number().int(),
  productTitle: z.string(),
  productInStock: z.string().refine((val) => val === "on" || val === "off"),
  productCategory: z.string(),
  productBrand: z.string(),
  productPackage: z.string(), // Will be converted to array of numbers later
  productCasePrice: z.string().refine((val) => !isNaN(parseFloat(val)), {
    message: "Invalid price format",
  }),
  productUnitPrice: z.string().optional(),
  productDescription: z.string().optional(),
  productImageURL: z.string().optional(),
  productVideoURL: z.string().optional(),
  productColors: z.array(z.string()).optional(),
  productEffects: z.array(z.string()).optional(),
});
