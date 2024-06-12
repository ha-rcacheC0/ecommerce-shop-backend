import { Router } from "express";
import { prisma } from "../../prisma/db.setup";

const cartRouter = Router();

cartRouter.get("/:cartId", async (req, res) => {
  const cartId = req.params.cartId;
  const cart = await prisma.cart.findFirst({
    where: {
      id: cartId,
    },
    include: {
      CartProducts: {
        include: {
          Product: {
            include: {
              Brands: true,
              Categories: true,
              ColorStrings: true,
              EffectStrings: true,
            },
          },
        },
      },
    },
  });
  if (!cart)
    return res.status(404).send({ message: "Cannot find cart with that id" });

  return res.status(200).send(cart);
});

cartRouter.post("/:cartId", async (req, res) => {
  const cartId = req.params.cartId;
  const { productId } = req.body;

  const cart = await prisma.cart.findFirst({
    where: {
      id: cartId,
    },
  });
  if (!cart)
    return res.status(404).send({ message: "Cannot find cart with that id" });

  const updatedCart = await prisma.cart.update({
    where: {
      id: cartId,
    },
    data: {
      CartProducts: {
        upsert: {
          where: {
            productId: productId,
            cartId: cartId,
          },
          create: {
            quantity: 1,
            Product: { connect: { id: productId } },
          },
          update: {
            quantity: {
              increment: 1,
            },
          },
        },
      },
    },
  });

  if (!updatedCart)
    return res
      .status(400)
      .send({ message: "Unable to add product to cart. Please try again" });
  return res.status(201).send(updatedCart);
});

export { cartRouter };
