import { Router } from "express";
import { prisma } from "../../prisma/db.setup";
import sdk from "@api/helcimdevdocs";
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
              UnitProduct: true,
            },
          },
        },
        orderBy: {
          productId: "asc",
        },
      },
    },
  });

  if (!cart) {
    return res.status(404).send({ message: "Cannot find cart with that id" });
  }

  return res.status(200).send(cart);
});

cartRouter.post("/:cartId/add", async (req, res) => {
  const { cartId } = req.params;
  const { productId, isUnit } = req.body;

  const cart = await prisma.cart.findFirst({
    where: { id: cartId },
  });

  if (!cart) {
    return res.status(404).send({ message: "Cannot find cart with that id" });
  }

  let createData;
  let updateData;

  if (isUnit) {
    createData = {
      unitQuantity: 1,
      productId, // Use productId directly, Prisma will link the Product based on this ID
    };
    updateData = {
      unitQuantity: {
        increment: 1,
      },
    };
  } else {
    createData = {
      caseQuantity: 1,
      productId, // Similar here, use the productId for linking
    };
    updateData = {
      caseQuantity: {
        increment: 1,
      },
    };
  }

  try {
    const updatedCart = await prisma.cart.update({
      where: { id: cartId },
      data: {
        CartProducts: {
          upsert: {
            where: {
              cartId_productId: {
                cartId,
                productId,
              },
            },
            create: createData,
            update: updateData,
          },
        },
      },
    });

    return res.status(201).send(updatedCart);
  } catch (error) {
    console.error("Error updating cart:", error);
    return res
      .status(400)
      .send({ message: "Unable to add product to cart. Please try again." });
  }
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
  const { cartId, productId, quantity, isUnit } = req.body;

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

  let updateData;

  if (isUnit) {
    updateData = {
      unitQuantity: quantity,
    };
  } else {
    updateData = {
      caseQuantity: quantity,
    };
  }

  const updatedCartProduct = await prisma.cartProduct.update({
    where: {
      cartId_productId: {
        cartId,
        productId,
      },
    },
    data: updateData,
  });

  return res.status(200).send(updatedCartProduct);
});

cartRouter.post("/:cartId/purchase", async (req, res) => {
  const { amount, CartProducts } = req.body;

  sdk
    .checkoutInit(
      {
        paymentType: "purchase",
        amount: amount,
        currency: "USD",
        paymentMethod: "cc-ach",
      },
      {
        "api-token": process.env.HELCIM_API_TOKEN!,
      }
    )
    .then(({ data }) => res.status(200).send(data))
    .catch((err) => console.error("Fetch Error ", err));
});

export { cartRouter };
