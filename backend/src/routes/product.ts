import { Router } from "express";
import { prisma } from "../../prisma/db.setup";
const productRouter = Router();

/* GET ALL. */
productRouter.get("/", async function (_req, res) {
  const allProducts = await prisma.product.findMany();

  return res.status(200).send(allProducts);
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

// DELETE - THIS NEEDS TO BE AUTHENTICATED WE DON"T WANT RANDOMS TO BE ABLE TO DELETE THE PRODUCTS -

export { productRouter };
