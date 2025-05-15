import { Router } from "express";

import {
  generateCaseBreakEmailHtml,
  generateEmailHtml,
  generateInventoryEmailHtml,
  sendEmail,
} from "../utils/email-utils";

import { prisma } from "../../prisma/db.setup";

const purchaseRouter = Router();

purchaseRouter.post("/", async (req, res) => {
  const {
    userId,
    shippingAddressId,
    amounts: { grandTotal, subtotal, tax, liftGateFee, shipping },
  } = req.body;

  if (!userId) {
    return res.status(400).send({ message: "User ID is required" });
  }

  // Get the user's cart
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: { cartProducts: true },
  });

  if (!cart || cart.cartProducts.length === 0) {
    return res.status(400).send({ message: "Cart is empty or not found" });
  }

  const purchaseItems = [];
  let hasUnits = false;
  let newBreakOrder = false;
  const newBreakOrders = [];
  const inventoryItems = [];

  for (const item of cart.cartProducts) {
    const product = await prisma.product.findUnique({
      where: { id: item.productId },
      include: { unitProduct: true },
    });

    if (!product) {
      return res
        .status(400)
        .send({ message: `Product with id ${item.productId} not found` });
    }

    if (item.caseQuantity > 0) {
      purchaseItems.push({
        quantity: item.caseQuantity,
        isUnit: false,
        itemSubtotal: product.casePrice.toNumber() * item.caseQuantity,
        Product: product,
      });
    }

    if (item.unitQuantity > 0) {
      const unitPrice = product.unitProduct!.unitPrice.toNumber();
      const availableStock = product.unitProduct!.availableStock;

      if (availableStock < item.unitQuantity) {
        const neededStock = item.unitQuantity - availableStock;
        const newOrder = await prisma.breakCaseRequest.create({
          data: {
            productId: item.productId,
            quantity: neededStock,
          },
          include: {
            product: true,
          },
        });
        purchaseItems.push({
          productId: item.productId,
          quantity: item.unitQuantity,
          itemSubtotal: unitPrice * item.unitQuantity,
          isUnit: true,
          id: item.id,
          Product: product,
        });
        newBreakOrders.push(newOrder);
        inventoryItems.push({
          productId: item.productId,
          quantity: availableStock,
          isUnit: true,
          id: item.id,
          Product: product,
        });
        newBreakOrder = true;
        hasUnits = true;
      } else {
        purchaseItems.push({
          productId: item.productId,
          quantity: item.unitQuantity,
          itemSubtotal: unitPrice * item.unitQuantity,
          isUnit: true,
          id: item.id,
          Product: product,
        });

        await prisma.unitProduct.update({
          where: { productId: item.productId },
          data: { availableStock: availableStock - item.unitQuantity },
        });

        hasUnits = true;
        inventoryItems.push({
          productId: item.productId,
          quantity: item.unitQuantity,
          isUnit: true,
          id: item.id,
          Product: product,
        });
      }
    }
  }
  const purchase = await prisma.purchaseRecord.create({
    data: {
      grandTotal,
      purchaseItems: {
        create: purchaseItems.map((item) => ({
          product: {
            connect: {
              id: item.Product.id,
            },
          },
          isUnit: item.isUnit,
          quantity: item.quantity,
          itemSubtotal: item.itemSubtotal,
        })),
      },
      subTotal: subtotal,
      tax,
      liftGateFee,
      shippingCost: shipping,
      discountAmount: 0,
      discountCode: null,
      discountType: null,
      shippingAddress: {
        connect: {
          id: shippingAddressId,
        },
      },
      user: {
        connect: {
          id: userId,
        },
      },
    },
    include: {
      purchaseItems: {
        include: {
          product: true,
        },
      },
      user: {
        include: {
          profile: true,
        },
      },
      shippingAddress: true,
    },
  });

  await prisma.cartProduct.deleteMany({
    where: { cartId: cart.id },
  });

  return res.status(201).send(purchase);
});

export { purchaseRouter };
