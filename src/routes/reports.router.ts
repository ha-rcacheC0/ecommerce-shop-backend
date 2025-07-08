// src/routes/reports.router.ts
import { Router } from "express";
import { prisma } from "../../prisma/db.setup";
import { authenticationAdminMiddleware } from "../utils/auth-utils";
import { stat } from "fs";

const reportsRouter = Router();

// Middleware to ensure only admins can access reports
reportsRouter.use(authenticationAdminMiddleware);

// Case Break Report endpoint
reportsRouter.get("/case-break", async (req, res) => {
  try {
    // Parse query parameters for date filtering
    const { startDate, endDate, status } = req.query;

    // Build where clause for the query
    const whereClause: any = {};

    if (startDate || endDate || status) {
      whereClause.createdAt = {};
      if (status) {
        whereClause.status = status;
      }

      if (startDate) {
        whereClause.createdAt.gte = new Date(startDate as string);
      }

      if (endDate) {
        whereClause.createdAt.lte = new Date(endDate as string);
      }
    }

    // Get case break requests
    const caseBreakRequests = await prisma.breakCaseRequest.findMany({
      where: whereClause,
      include: {
        product: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Format data for CSV export
    const csvData = caseBreakRequests.map((request) => ({
      id: request.id,
      productId: request.productId,
      sku: request.product.sku,
      title: request.product.title,
      boxSize: request.product.package,
      quantity: request.quantity,
      status: request.status,
      createdAt: request.createdAt.toISOString(),
      formattedDate: request.createdAt.toLocaleString(),
    }));

    // Return the data
    return res.status(200).json({
      success: true,
      data: csvData,
      count: csvData.length,
      totalQuantity: csvData.reduce((sum, item) => sum + item.quantity, 0),
    });
  } catch (error) {
    console.error("Error fetching case break report:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate case break report",
    });
  }
});

// Process a case break request
reportsRouter.post("/case-break/:id/process", async (req, res) => {
  try {
    const { id } = req.params;
    const { quantityAdded } = req.body;

    if (!quantityAdded || isNaN(parseInt(quantityAdded))) {
      return res.status(400).json({
        success: false,
        message: "Valid quantity is required",
      });
    }

    // Find the case break request
    const caseBreakRequest = await prisma.breakCaseRequest.findUnique({
      where: { id },
      include: {
        product: {
          include: { unitProduct: true },
        },
      },
    });

    if (!caseBreakRequest) {
      return res.status(404).json({
        success: false,
        message: "Case break request not found",
      });
    }

    // Update the unit product inventory
    if (!caseBreakRequest.product.unitProduct) {
      return res.status(400).json({
        success: false,
        message: "This product doesn't have unit inventory",
      });
    }

    // Update inventory in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update the unit product inventory
      const updatedUnitProduct = await tx.unitProduct.update({
        where: { id: caseBreakRequest.product.unitProduct!.id },
        data: {
          availableStock: {
            increment: parseInt(quantityAdded),
          },
        },
      });

      //  mark the case break request as completed

      await tx.breakCaseRequest.update({
        where: { id },
        data: { status: "COMPLETED" },
      });

      return updatedUnitProduct;
    });

    return res.status(200).json({
      success: true,
      message: "Case break request processed successfully",
      data: {
        productId: caseBreakRequest.productId,
        sku: caseBreakRequest.product.sku,
        title: caseBreakRequest.product.title,
        addedQuantity: parseInt(quantityAdded),
        newTotalStock: result.availableStock,
      },
    });
  } catch (error) {
    console.error("Error processing case break request:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to process case break request",
    });
  }
});

reportsRouter.get("/purchases", async (req, res) => {
  const { startDate, endDate } = req.query;

  const whereClause: any = {};

  if (startDate || endDate) {
    whereClause.date = {};

    if (startDate) {
      whereClause.date.gte = new Date(startDate as string);
    }

    if (endDate) {
      whereClause.date.lte = new Date(endDate as string);
    }
  }
  try {
    const purchases = await prisma.purchaseRecord.findMany({
      where: whereClause,
      select: {
        id: true,
        date: true,
        grandTotal: true,
        shippingCost: true,
        tax: true,
        liftGateFee: true,
        subTotal: true,
        status: true,
        discountAmount: true,
        discountCode: true,
        discountType: true,
        shippingAddress: {
          select: {
            id: true,
            street1: true,
            street2: true,
            city: true,
            state: true,
            postalCode: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                phoneNumber: true,
              },
            },
          },
        },
        purchaseItems: {
          select: {
            product: {
              select: {
                id: true,
                title: true,
                sku: true,
                isShow: true,
                unitProduct: {
                  select: {
                    id: true,
                    availableStock: true,
                  },
                },
              },
            },
            itemSubTotal: true,
            isUnit: true,
            quantity: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });
    return res.json(purchases);
  } catch (error) {
    console.error("Error fetching purchases:", error);
    res.status(500).json({ error: "Failed to fetch purchases" });
  }
});
reportsRouter.patch("/purchases/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const updatedPurchase = await prisma.purchaseRecord.update({
      where: { id },
      data: { status },
    });
    res.json(updatedPurchase);
  } catch (error) {
    console.error("Error updating purchase status:", error);
    res.status(500).json({ error: "Failed to update purchase status" });
  }
});

reportsRouter.get("/inventory", authenticationAdminMiddleware, (req, res) => {
  res
    .status(200)
    .json({ message: "Inventory report endpoint (under development)" });
});

reportsRouter.get(
  "/user-activity",
  authenticationAdminMiddleware,
  (req, res) => {
    res
      .status(200)
      .json({ message: "User activity report endpoint (under development)" });
  }
);

reportsRouter.get("/financial", authenticationAdminMiddleware, (req, res) => {
  res
    .status(200)
    .json({ message: "Financial report endpoint (under development)" });
});

export { reportsRouter };
