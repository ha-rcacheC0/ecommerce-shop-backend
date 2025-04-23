import { Router } from "express";
import { prisma } from "../../prisma/db.setup";
const adminRouter = Router();

/* GET inventory with pagination and filtering */
adminRouter.get("/inventory", async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const skip = (page - 1) * pageSize;

    const searchTerm = (req.query.search as string) || "";
    const viewFilter = (req.query.view as string) || "";

    const whereConditions: any = {};

    // Apply search filter if provided
    if (searchTerm) {
      whereConditions.OR = [
        { sku: { contains: searchTerm, mode: "insensitive" } },
        { product: { title: { contains: searchTerm, mode: "insensitive" } } },
      ];
    }

    if (viewFilter === "low-stock") {
      whereConditions.availableStock = {
        gt: 0,
        lt: 10,
      };
    } else if (viewFilter === "out-of-stock") {
      whereConditions.availableStock = 0;
    }

    const totalItems = await prisma.unitProduct.count({
      where: whereConditions,
    });

    const inventory = await prisma.unitProduct.findMany({
      where: whereConditions,
      include: {
        product: true,
      },
      orderBy: {
        productId: "asc",
      },
      skip,
      take: pageSize,
    });

    const totalPages = Math.ceil(totalItems / pageSize);
    const hasMore = page < totalPages;

    return res.status(200).json({
      items: inventory,
      pagination: {
        currentPage: page,
        pageSize,
        totalItems,
        totalPages,
        hasMore,
      },
    });
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return res.status(500).json({
      message: "An error occurred while fetching inventory data",
    });
  }
});

export { adminRouter };
