import { PrismaClient } from "@prisma/client";
import express from "express";
import { connect } from "http2";
import { generateEmailHtml, sendEmail } from "../utils/email-utils";

const prisma = new PrismaClient();
const purchaseRouter = express.Router();

purchaseRouter.post("/", async (req, res) => {
  const { userId, shippingAddressId } = req.body;

  if (!userId) {
    return res.status(400).send({ message: "User ID is required" });
  }

  // Get the user's cart
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: { CartProducts: true },
  });

  if (!cart || cart.CartProducts.length === 0) {
    return res.status(400).send({ message: "Cart is empty or not found" });
  }

  let amount = 0;
  const purchaseItems = [];
  let hasUnits = false;

  for (const item of cart.CartProducts) {
    const product = await prisma.product.findUnique({
      where: { id: item.productId },
      include: { UnitProduct: true },
    });

    if (!product) {
      return res
        .status(400)
        .send({ message: `Product with id ${item.productId} not found` });
    }

    if (item.caseQuantity > 0) {
      amount += product.casePrice.toNumber() * item.caseQuantity;
      purchaseItems.push({
        productId: item.productId,
        quantity: item.caseQuantity,
        isUnit: false,
      });
    }

    if (item.unitQuantity > 0) {
      const unitPrice = product.UnitProduct!.unitPrice.toNumber();
      const availableStock = product.UnitProduct!.availableStock;

      if (availableStock < item.unitQuantity) {
        const neededStock = item.unitQuantity - availableStock;
        await prisma.breakCaseRequest.create({
          data: {
            productId: item.productId,
            quantity: neededStock,
          },
        });

        amount += unitPrice * availableStock;
        purchaseItems.push({
          productId: item.productId,
          quantity: availableStock,
          isUnit: true,
        });

        hasUnits = true;
      } else {
        amount += unitPrice * item.unitQuantity;
        purchaseItems.push({
          productId: item.productId,
          quantity: item.unitQuantity,
          isUnit: true,
        });

        await prisma.unitProduct.update({
          where: { productId: item.productId },
          data: { availableStock: availableStock - item.unitQuantity },
        });

        hasUnits = true;
      }
    }
  }

  console.log("shippingAddressId", shippingAddressId);

  const purchase = await prisma.purchaseRecord.create({
    data: {
      amount,
      PurchaseItems: {
        create: purchaseItems,
      },
      shippingAddress: {
        connect: {
          id: shippingAddressId,
        },
      },
      User: {
        connect: {
          id: userId,
        },
      },
    },
    include: {
      PurchaseItems: true,
    },
  });

  await prisma.cartProduct.deleteMany({
    where: { cartId: cart.id },
  });

  // Sending email logic
  const staffEmail = process.env.SEND_EMAIL_TO_EMAIL!; // Replace with actual staff email

  if (!hasUnits) {
    // Send email immediately for case-only orders
    await sendEmail(
      staffEmail,
      "New Order for Shipping",
      generateEmailHtml(purchase)
    );
  }

  return res.status(201).send(purchase);
});

export { purchaseRouter };
