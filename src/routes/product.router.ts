import { Router } from "express";
import { prisma } from "../../prisma/db.setup";
import { Decimal } from "decimal.js";

import { z } from "zod";
import { Prisma } from "@prisma/client";
import { calcUnitPrice } from "../utils/creation-utils";

const productRouter = Router();
type ProductCreateInput = Prisma.ProductCreateInput;
type ProductUpdateInput = Prisma.ProductUpdateInput;
const filterSchema = z.object({
  page: z.coerce.number().positive(),
  pageSize: z.coerce.number().positive(),
  searchTitle: z.string().optional(),
  brands: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
  colors: z.array(z.string()).optional(),
  effects: z.array(z.string()).optional(),
});

/* GET ALL. */
productRouter.get("/", async function (req, res) {
  try {
    const { page, pageSize, searchTitle, brands, categories, colors, effects } =
      filterSchema.parse({
        ...req.query,
        brands: Array.isArray(req.query.brands)
          ? req.query.brands
          : req.query.brands
          ? [req.query.brands]
          : undefined,
        categories: Array.isArray(req.query.categories)
          ? req.query.categories
          : req.query.categories
          ? [req.query.categories]
          : undefined,
        colors: Array.isArray(req.query.colors)
          ? req.query.colors
          : req.query.colors
          ? [req.query.colors]
          : undefined,
        effects: Array.isArray(req.query.effects)
          ? req.query.effects
          : req.query.effects
          ? [req.query.effects]
          : undefined,
      });
    const whereClause: Prisma.ProductWhereInput = {};

    if (searchTitle) {
      whereClause.title = {
        contains: searchTitle,
        mode: "insensitive" as Prisma.QueryMode,
      };
    }

    if (brands?.length) {
      whereClause.brand = { name: { in: brands } };
    }

    if (categories?.length) {
      whereClause.category = { name: { in: categories } };
    }

    if (colors?.length) {
      whereClause.colors = { some: { name: { in: colors } } };
    }

    if (effects?.length) {
      whereClause.effects = { some: { name: { in: effects } } };
    }

    const totalCount = await prisma.product.count({ where: whereClause });
    const totalPages = Math.ceil(totalCount / pageSize);

    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        brand: { select: { name: true } },
        category: { select: { name: true } },
        colors: { select: { name: true } },
        effects: { select: { name: true } },
        unitProduct: true,
      },
      orderBy: { id: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return res.status(200).json({
      contents: products,
      hasMore: page < totalPages,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ message: "Invalid request parameters" });
  }
});

// GET ONE  - ID // ANY UNIQUE VALUE

productRouter.get("/:id", async function (req, res) {
  const id = req.params.id;

  const product = await prisma.product.findFirst({
    where: {
      id: id,
    },
    include: {
      brand: {
        select: { name: true },
      },
      category: {
        select: {
          name: true,
        },
      },
      colors: {
        select: { name: true, id: true },
      },
      effects: {
        select: { name: true, id: true },
      },
      unitProduct: true,
    },
  });
  if (!product)
    return res.status(404).send({ message: "No product was found " });

  return res.status(200).send(product);
});

// TODO: ADD MIDDLEWARES TO :  VALIDATE USER MAKING REQUEST,VALIDATE REQUEST BODY

productRouter.post("/create", async function (req, res) {
  const {
    productID,
    productTitle,
    productInStock,
    productCategory,
    productBrand,
    productPackage,
    productCasePrice,
    productDescription,
    productImageURL,
    productVideoURL,
    productColors = [], // Optional array of color IDs
    productEffects = [], // Optional array of effect IDs
  } = req.body;

  const packageIntArray: number[] = productPackage.split(",").map(Number);
  const newProductData: ProductCreateInput = {
    sku: +productID,
    title: productTitle,
    inStock: productInStock === "on", // Convert 'on' to boolean
    casePrice: new Decimal(productCasePrice).toFixed(2), // Ensure precision to 2 decimal places
    package: packageIntArray,
    description: productDescription,
    image: productImageURL || "placeholder", // Default to 'placeholder' if image is not provided
    videoURL: productVideoURL,
    effects: {
      connect:
        productEffects.length > 0
          ? productEffects.map((effectName: string) => ({
              name: effectName,
            }))
          : undefined,
    },
    colors: {
      connect:
        productColors.length > 0
          ? productColors.map((colorName: string) => ({ name: colorName }))
          : undefined,
    },
    brand: {
      connectOrCreate: {
        where: {
          name: productBrand,
        },
        create: {
          name: productBrand,
        },
      },
    },
    category: {
      connect: { name: productCategory },
    },
  };
  // Conditionally add Brands and Categories only if they are provided

  try {
    const newProduct = await prisma.product.create({
      data: {
        ...newProductData,
        unitProduct: {
          create: {
            unitPrice: calcUnitPrice(productCasePrice, packageIntArray[0]),
            sku: productID + "-u",
            availableStock: 0,
            package: [1, ...packageIntArray.slice(1)],
          },
        },
      },

      include: {
        brand: true,
        category: true,
        effects: true,
        colors: true,
      },
    });

    if (!newProduct)
      return res
        .status(500)
        .send({ message: "Internal Server Error. Product not Created" });
    console.log("Created Product successfully");
    return res.status(201).send(newProduct);
  } catch (error) {
    console.error(error);
    return res.status(500).send({ error: "Server Error" });
  }
});

// PATCH (or PUT) - THIS NEEDS TO BE AUTHENTICATED WE DON"T WANT RANDOMS TO BE ABLE TO EDIT THE PRODUCTS   -
// VALIDATE BODY TO ONLY HAVE FIELDS THAT CAN EXIST BUT DON'T NEED TO HAVE ALL FIELDS

productRouter.post("/:id", async function (req, res) {
  const idAsNum = +req.params.id;

  if (isNaN(idAsNum)) {
    return res
      .status(503)
      .send({ message: "Id must be a number, please try again" });
  }

  const {
    productID,
    productTitle,
    productDescription,
    productImageURL,
    productCasePrice,
    productInStock,
    productCaseBreakable,
    productPackage,
    productCategory,
    productBrand,
    productColors = [],
    productEffects = [],
    productVideoURL,
  } = req.body;

  const updateData: ProductUpdateInput = {
    sku: +productID,
    title: productTitle,
    description: productDescription,
    image: productImageURL,
    casePrice: new Decimal(productCasePrice).toFixed(2),
    inStock: productInStock === "on",
    package: productPackage.split(",").map(Number), // Convert package to array of integers
    videoURL: productVideoURL,
    isCaseBreakable: productCaseBreakable === "on",
    effects: {
      connect:
        productEffects.length > 0
          ? productEffects.map((effectName: string) => ({ name: effectName }))
          : undefined,
    },
    colors: {
      connect:
        productColors.length > 0
          ? productColors.map((colorName: string) => ({ name: colorName }))
          : undefined,
    },
  };

  // Conditionally add Brands and Categories only if they are provided
  if (productBrand) {
    updateData.brand = {
      connect: { name: productBrand },
    };
  }

  if (productCategory) {
    updateData.category = {
      connect: { name: productCategory },
    };
  }

  try {
    const modifiedProduct = await prisma.product.update({
      where: {
        sku: idAsNum,
      },
      data: updateData,
    });

    if (!modifiedProduct)
      return res.status(500).send({ error: "Unable to Modify" });
    return res.send(201).send(modifiedProduct);
  } catch (error) {
    console.error(error);
    return res.status(500).send({ error: "Server Error" });
  }
});

// DELETE - THIS NEEDS TO BE AUTHENTICATED WE DON"T WANT RANDOMS TO BE ABLE TO DELETE THE PRODUCTS -

productRouter.delete("/:id", async function (req, res) {
  const idAsNum = +req.params.id;

  if (isNaN(idAsNum))
    return res
      .status(503)
      .send({ message: "Id must be a number , please try again" });

  const deletedProduct = await prisma.product.delete({
    where: {
      sku: idAsNum,
    },
  });
  return res.status(200).send(deletedProduct);
});

export { productRouter };
