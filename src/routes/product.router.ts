import { Router } from "express";
import { prisma } from "../../prisma/db.setup";
import { Decimal } from "decimal.js";

import { validateRequestQuery } from "zod-express-middleware";
import { z } from "zod";
import { productSchema } from "../utils/validation-utils";
import { Prisma } from "@prisma/client";
import { calcUnitPrice } from "../utils/creation-utils";

const productRouter = Router();
type ProductCreateInput = Prisma.ProductCreateInput;

/* GET ALL. */
productRouter.get(
  "/",
  validateRequestQuery(
    z.object({ page: z.coerce.number(), pageSize: z.coerce.number() })
  ),
  async function (req, res) {
    const page = req.query.page;
    const pageSize = +req.query.pageSize;
    const offset = (page - 1) * pageSize;
    const allProducts = await prisma.product.findMany({
      include: {
        Brands: {
          select: { name: true },
        },
        Categories: {
          select: {
            name: true,
          },
        },
        ColorStrings: {
          select: { name: true },
        },
        EffectStrings: {
          select: { name: true },
        },
        UnitProduct: true,
      },
      orderBy: {
        id: "asc",
      },
    });
    const totalPages = Math.ceil(allProducts.length / pageSize);

    if (!allProducts)
      return res.status(400).send({ message: "Unable to find products" });

    return res.status(200).send({
      contents: allProducts.slice(offset, offset + pageSize),
      hasMore: page < totalPages,
    });
  }
);

// GET ONE  - ID // ANY UNIQUE VALUE

productRouter.get("/:id", async function (req, res) {
  const id = req.params.id;

  const product = await prisma.product.findFirst({
    where: {
      id: id,
    },
    include: {
      Brands: {
        select: { name: true },
      },
      Categories: {
        select: {
          name: true,
        },
      },
      ColorStrings: {
        select: { name: true, id: true },
      },
      EffectStrings: {
        select: { name: true, id: true },
      },
      UnitProduct: true,
    },
  });
  if (!product)
    return res.status(404).send({ message: "No product was found " });

  return res.status(200).send(product);
});

// POST - THIS NEEDS TO BE AUTHENTICATED WE DON"T WANT RANDOMS TO BE ABLE TO ADD THERE OWN PRODUCTS

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
    EffectStrings: {
      connect:
        productEffects.length > 0
          ? productEffects.map((effectName: string) => ({
              name: effectName,
            }))
          : undefined,
    },
    ColorStrings: {
      connect:
        productColors.length > 0
          ? productColors.map((colorName: string) => ({ name: colorName }))
          : undefined,
    },
    Brands: {
      connectOrCreate: {
        where: {
          name: productBrand,
        },
        create: {
          name: productBrand,
        },
      },
    },
    Categories: {
      connect: { name: productCategory },
    },
  };
  // Conditionally add Brands and Categories only if they are provided

  try {
    const newProduct = await prisma.product.create({
      data: {
        ...newProductData,
        UnitProduct: {
          create: {
            unitPrice: calcUnitPrice(productCasePrice, packageIntArray[0]),
            sku: productID + "-u",
            availableStock: 0,
            package: [1, ...packageIntArray.slice(1)],
          },
        },
      },

      include: {
        Brands: true,
        Categories: true,
        EffectStrings: true,
        ColorStrings: true,
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

  const updateData: any = {
    sku: +productID,
    title: productTitle,
    description: productDescription,
    image: productImageURL,
    casePrice: new Decimal(productCasePrice).toFixed(2),
    inStock: productInStock === "on",
    package: productPackage.split(",").map(Number), // Convert package to array of integers
    videoURL: productVideoURL,
    isCaseBreakable: productCaseBreakable === "on",
    EffectStrings: {
      connect:
        productEffects.length > 0
          ? productEffects.map((effectName: string) => ({ name: effectName }))
          : undefined,
    },
    ColorStrings: {
      connect:
        productColors.length > 0
          ? productColors.map((colorName: string) => ({ name: colorName }))
          : undefined,
    },
  };

  // Conditionally add Brands and Categories only if they are provided
  if (productBrand) {
    updateData.Brands = {
      connect: { name: productBrand },
    };
  }

  if (productCategory) {
    updateData.Categories = {
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
