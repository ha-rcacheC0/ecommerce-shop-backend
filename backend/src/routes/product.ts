import { Router } from "express";
import { prisma } from "../../prisma/db.setup";
const productRouter = Router();

/* GET ALL. */
productRouter.get("/", async function (req, res, next) {
  const allProducts = await prisma.product.findMany();

  return res.status(200).send(allProducts);
});

// GET ONE  - ID // ANY UNIQUE VALUE

productRouter.get("/:id", async function (req, res, next) {
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

// PATCH (or PUT) - THIS NEEDS TO BE AUTHENTICATED WE DON"T WANT RANDOMS TO BE ABLE TO EDIT THE PRODUCTS   -

// DELETE - THIS NEEDS TO BE AUTHENTICATED WE DON"T WANT RANDOMS TO BE ABLE TO DELETE THE PRODUCTS -

export { productRouter };
