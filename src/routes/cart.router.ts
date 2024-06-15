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

cartRouter.post("/:cartId/add", async (req, res) => {
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

cartRouter.post("/:cartId/remove", async (req, res) => {
  const cartId = req.params.cartId;
  const { productId } = req.body;

  const cart = await prisma.cart.findFirst({
    where: {
      id: cartId,
    },
    include: {
      CartProducts: true, // Include the CartProducts to check if the product is in the cart
    },
  });

  if (!cart)
    return res.status(404).send({ message: "Cannot find cart with that id" });

  const cartProduct = cart.CartProducts.find(
    (cp) => cp.productId === productId
  );

  if (!cartProduct)
    return res.status(404).send({ message: "Cannot find product in cart" });

  const updatedCart = await prisma.cart.update({
    where: {
      id: cartId,
    },
    data: {
      CartProducts: {
        deleteMany: {
          cartId: cartId,
          productId: productId,
        },
      },
    },
  });

  if (!updatedCart)
    return res.status(400).send({
      message: "Unable to remove product from cart. Please try again",
    });

  return res.status(200).send(updatedCart);
});

cartRouter.post("/:cartId/updateQuantity", async (req, res) => {
  const { cartId, productId, quantity } = req.body;

  if (quantity < 1) {
    return res.status(400).send({ message: "Quantity must be at least 1" });
  }

  const cartProduct = await prisma.cartProduct.findUnique({
    where: {
      cartId_productId: {
        cartId,
        productId,
      },
    },
  });

  if (!cartProduct) {
    return res.status(404).send({ message: "Product not found in cart" });
  }

  const updatedCartProduct = await prisma.cartProduct.update({
    where: {
      cartId_productId: {
        cartId,
        productId,
      },
    },
    data: {
      quantity,
    },
  });

  return res.status(200).send(updatedCartProduct);
});
export { cartRouter };
