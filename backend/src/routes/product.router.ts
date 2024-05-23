import { Router } from "express";
import { prisma } from "../../prisma/db.setup";
import { title } from "process";
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
        select: { name: true, id: true },
      },
    },
  });

  return res.render("admin", {
    title: "Product List",
    page: "product-table",
    products: allProducts,
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
    id,
    title,
    inStock,
    category,
    brand,
    packageSize,
    price,
    description,
    image,
  } = req.body;
  const newProduct = await prisma.product.create({
    data: {
      id,
      title,
      inStock,
      casePrice: price,
      package: packageSize,
      Brands: {
        connect: { id: brand },
      },
      Categories: { connect: { id: category } },
      effects: { connect: [] },
      ColorStrings: { connect: [] },
      description,
      image,
    },
  });

  if (!newProduct)
    return res
      .status(500)
      .send({ message: "Internal Server Error. Product not Created" });

  return res.status(201).send(newProduct);
});

// PATCH (or PUT) - THIS NEEDS TO BE AUTHENTICATED WE DON"T WANT RANDOMS TO BE ABLE TO EDIT THE PRODUCTS   -
// VALIDATE BODY TO ONLY HAVE FIELDS THAT CAN EXIST BUT DON'T NEED TO HAVE ALL FIELDS

productRouter.patch("/:id", async function (req, res) {
  const idAsNum = +req.params.id;

  if (isNaN(idAsNum)) {
    return res
      .status(503)
      .send({ message: "Id must be a number, please try again" });
  }

  const {
    brand, // New brand ID to connect
    category, // New category ID to connect
    newEffects = [], // Array of effect IDs to connect
    removeEffects = [], // Array of effect IDs to disconnect
    newColors = [], // Array of color string IDs to connect
    removeColors = [], // Array of color string IDs to disconnect
    ...updateData // Other fields to update
  } = req.body;

  const modifiedProduct = await prisma.product.update({
    where: {
      id: idAsNum,
    },
    data: {
      ...updateData,
      Brands: brand ? { connect: { id: brand } } : undefined,
      Categories: category ? { connect: { id: category } } : undefined,
      effects: {
        connect:
          newEffects.length > 0
            ? newEffects.map((effectId: string) => ({ id: effectId }))
            : undefined,
        disconnect:
          removeEffects.length > 0
            ? removeEffects.map((effectId: string) => ({ id: effectId }))
            : undefined,
      },
      ColorStrings: {
        connect:
          newColors.length > 0
            ? newColors.map((colorId: string) => ({ id: colorId }))
            : undefined,
        disconnect:
          removeColors.length > 0
            ? removeColors.map((colorId: string) => ({ id: colorId }))
            : undefined,
      },
    },
  });

  if (!modifiedProduct)
    return res.status(500).send({ error: "Unable to Modify" });
  return res.status(201).send(modifiedProduct);
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
