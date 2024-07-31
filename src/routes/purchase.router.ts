import { Router } from "express";

import {
  generateCaseBreakEmailHtml,
  generateEmailHtml,
  generateInventoryEmailHtml,
  sendEmail,
} from "../utils/email-utils";
import { PurchaseItem } from "../utils/types";
import { prisma } from "../../prisma/db.setup";

const purchaseRouter = Router();

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
  let newBreakOrder = false;
  const newBreakOrders = [];
  const inventoryItems = [];

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
        quantity: item.caseQuantity,
        isUnit: false,
        Product: product,
      });
    }

    if (item.unitQuantity > 0) {
      const unitPrice = product.UnitProduct!.unitPrice.toNumber();
      const availableStock = product.UnitProduct!.availableStock;

      if (availableStock < item.unitQuantity) {
        const neededStock = item.unitQuantity - availableStock;
        const newOrder = await prisma.breakCaseRequest.create({
          data: {
            productId: item.productId,
            quantity: neededStock,
          },
          include: {
            Product: true,
          },
        });

        amount += unitPrice * availableStock;
        purchaseItems.push({
          productId: item.productId,
          quantity: item.unitQuantity,
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
        amount += unitPrice * item.unitQuantity;
        purchaseItems.push({
          productId: item.productId,
          quantity: item.unitQuantity,
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
      amount,
      PurchaseItems: {
        create: purchaseItems.map((item) => ({
          Product: {
            connect: {
              id: item.Product.id,
            },
          },
          isUnit: item.isUnit,
          quantity: item.quantity,
        })),
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
      PurchaseItems: {
        include: {
          Product: true,
        },
      },
      User: {
        include: {
          profiles: true,
        },
      },
      shippingAddress: true,
    },
  });

  await prisma.cartProduct.deleteMany({
    where: { cartId: cart.id },
  });

  const warehouseEmail = process.env.SEND_EMAIL_WAREHOUSE_EMAIL!;
  const inventoryManagerEmail = process.env.SEND_EMAIL_INVENTORY_EMAIL!;

  // Email to inventory manager
  if (inventoryItems.length > 0) {
    await sendEmail(
      inventoryManagerEmail,
      `Inventory Request - Order : ${purchase.id}`,
      generateInventoryEmailHtml(purchase, inventoryItems, newBreakOrders)
    );
  }

  // Email to warehouse for case break request
  if (newBreakOrder) {
    await sendEmail(
      warehouseEmail,
      `Crew Fireworks - Case Break - Order : ${purchase.id}`,
      generateCaseBreakEmailHtml(purchase, newBreakOrders)
    );
  }

  // Email to warehouse for holding order
  if (hasUnits) {
    await sendEmail(
      warehouseEmail,
      `Crew Fireworks - Order : ${purchase.id} - ON HOLD for UNITS`,
      generateEmailHtml({ ...purchase, hasUnits: true })
    );
  } else {
    // No units, send order directly to warehouse
    await sendEmail(
      warehouseEmail,
      `Crew Fireworks  - Order : ${purchase.id} `,
      generateEmailHtml(purchase)
    );
  }
  return res.status(201).send(purchase);
});

export { purchaseRouter };
