import { Router } from "express";
import { prisma } from "../../prisma/db.setup";
import { Decimal } from "decimal.js";
import { Brand, Category, Colors, Effects } from "@prisma/client";

const productRouter = Router();

/* GET ALL. */
productRouter.get("/", async function (_req, res) {
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
      effects: {
        select: { name: true },
      },
    },
    orderBy: {
      id: "asc",
    },
  });

  return res.render("admin", {
    title: "Product List",
    page: "product-table",

    products: allProducts,
  });
});

productRouter.get("/create", function (_req, res) {
  return res.render("admin", {
    title: "Product Management",
    page: "product-details",
    product: {
      Categories: [{ name: null }],
      Brands: [{ name: null }],
      ColorStrings: [{ name: null }],
      effects: [{ name: null }],
    },
    categories: Category,
    brands: Brand,
    effects: Effects,
    colors: Colors,
  });
});

// GET ONE  - ID // ANY UNIQUE VALUE

productRouter.get("/:id", async function (req, res) {
  const idAsNum = +req.params.id;

  if (isNaN(idAsNum))
    return res
      .status(503)
      .send({ message: "Id must be a number , please try again" });

  const product = await prisma.product.findFirst({
    where: {
      id: idAsNum,
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
      effects: {
        select: { name: true, id: true },
      },
    },
  });
  if (!product)
    return res.status(404).send({ message: "No product was found " });

  return res.render("admin", {
    title: "Product Management",
    page: "product-details",
    product: product,
    categories: Category,
    brands: Brand,
    effects: Effects,
    colors: Colors,
  });
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
    productUnitPrice,
    productDescription,
    productImageURL,
    productVideoURL,
    productColors = [], // Optional array of color IDs
    productEffects = [], // Optional array of effect IDs
  } = req.body;

  const newProductData = {
    id: +productID,
    title: productTitle,
    inStock: productInStock === "on", // Convert 'on' to boolean
    unitPrice: new Decimal(productUnitPrice).toFixed(2),
    casePrice: new Decimal(productCasePrice).toFixed(2), // Ensure precision to 2 decimal places
    package: productPackage.split(",").map(Number), // Convert productPackage to array of integers
    description: productDescription,
    image: productImageURL || "placeholder", // Default to 'placeholder' if image is not provided
    videoURL: productVideoURL,
    Brands: {
      connect: { name: productBrand },
    },
    Categories: { connect: { name: productCategory } },
    effects: {
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

  try {
    const newProduct = await prisma.product.create({
      data: newProductData,
    });

    if (!newProduct)
      return res
        .status(500)
        .send({ message: "Internal Server Error. Product not Created" });
    console.log("Created Product successfully");
    return res.redirect("/api/products");
  } catch (error) {
    console.error(error);
    return res.status(500).send({ error: "Server Error" });
  }
});

// PATCH (or PUT) - THIS NEEDS TO BE AUTHENTICATED WE DON"T WANT RANDOMS TO BE ABLE TO EDIT THE PRODUCTS   -
// VALIDATE BODY TO ONLY HAVE FIELDS THAT CAN EXIST BUT DON'T NEED TO HAVE ALL FIELDS

productRouter.post("/:id", async function (req, res) {
  const idAsNum = +req.params.id;
  console.log("body", req.body);

  if (isNaN(idAsNum)) {
    return res
      .status(503)
      .send({ message: "Id must be a number, please try again" });
  }

  const {
    productID,
    productTitle,
    productCasePrice,
    productInStock,
    productCategory,
    productBrand,
    productPackage,
    productColors = [],
    productEffects = [],
    productDescription,
    productImageURL,
    productUnitPrice,
    productVideoURL,
  } = req.body;

  const updateData = {
    id: +productID,
    title: productTitle,
    casePrice: new Decimal(productCasePrice).toFixed(2),
    inStock: productInStock === "on",
    package: productPackage.split(",").map(Number), // Convert package to array of integers
    description: productDescription,
    unitPrice: new Decimal(productUnitPrice).toFixed(2),
    videoURL: productVideoURL,
    image: productImageURL,
    Brands: productBrand ? { connect: { name: productBrand } } : undefined,
    Categories: productCategory
      ? { connect: { name: productCategory } }
      : undefined,
    effects: {
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

  try {
    const modifiedProduct = await prisma.product.update({
      where: {
        id: idAsNum,
      },
      data: updateData,
    });

    if (!modifiedProduct)
      return res.status(500).send({ error: "Unable to Modify" });
    return res.status(201).send(modifiedProduct);
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
      id: idAsNum,
    },
  });
  return res.status(200).send(deletedProduct);
});

export { productRouter };
