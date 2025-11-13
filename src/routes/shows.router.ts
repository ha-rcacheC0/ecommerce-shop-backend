import { Router } from "express";
import { prisma } from "../../prisma/db.setup";
import { z } from "zod";

import { authenticationAdminMiddleware } from "../utils/auth-utils";
import { Decimal } from "@prisma/client/runtime/library";
import { logger } from "../utils/logger";

const showsRouter = Router();

// Schema for filtering shows
const showFilterSchema = z.object({
  page: z.coerce.number().positive().default(1),
  pageSize: z.coerce.number().positive().default(20),
  typeId: z.string().optional(),
  searchTitle: z.string().optional(),
});

// Schema for show products
const showProductSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
  isUnit: z.boolean().default(false),
  notes: z.string().optional(),
});

// Schema for creating shows
const createShowSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  casePrice: z.number().positive("Price must be positive"),
  image: z.string().optional().default("placeholder"),
  videoURL: z.string().url().optional(),
  inStock: z.boolean().default(true),
  showTypeId: z.string(),
  brandId: z.string(),
  categoryId: z.string(),
  products: z
    .array(showProductSchema)
    .min(1, "At least one product is required"),
});

// Schema for updating shows
const updateShowSchema = createShowSchema.partial();

/* GET all shows */
showsRouter.get("/", async (req, res) => {
  try {
    const validatedQuery = showFilterSchema
      .extend({
        brandId: z.string().optional(), // Add brand filter
      })
      .parse(req.query);

    const { page, pageSize, typeId, searchTitle, brandId } = validatedQuery;
    const whereClause: any = { isShow: true };

    // Add brand filter if provided
    if (brandId) {
      whereClause.brandId = brandId;
    }

    // Add type filter if provided
    if (typeId) {
      whereClause.showTypeId = typeId;
    }

    // Add search filter if provided
    if (searchTitle) {
      whereClause.OR = [
        { title: { contains: searchTitle, mode: "insensitive" } },
        { description: { contains: searchTitle, mode: "insensitive" } },
      ];
    }

    // Get total count for pagination
    const total = await prisma.product.count({ where: whereClause });

    // Get shows with pagination
    const shows = await prisma.product.findMany({
      where: whereClause,
      include: {
        showType: true,
        brand: true,
        category: true,
        showProducts: {
          include: {
            product: {
              include: {
                brand: true,
                category: true,
                unitProduct: true,
              },
            },
          },
        },
      },
      orderBy: { title: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return res.status(200).json({
      shows,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Error fetching shows:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/* GET shows by brand */
showsRouter.get("/brand/:brandId", async (req, res) => {
  try {
    const { brandId } = req.params;
    const { page, pageSize, typeId, searchTitle } = showFilterSchema.parse(
      req.query
    );

    // Verify brand exists
    const brand = await prisma.brand.findUnique({
      where: { name: brandId },
    });
    logger.debug({ brandId, brand }, "Fetched brand for shows");

    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    const whereClause: any = {
      isShow: true,
      brandId: brand.id,
    };

    // Add type filter if provided
    if (typeId) {
      whereClause.showTypeId = typeId;
    }

    // Add search filter if provided
    if (searchTitle) {
      whereClause.OR = [
        { title: { contains: searchTitle, mode: "insensitive" } },
        { description: { contains: searchTitle, mode: "insensitive" } },
      ];
    }

    // Get total count for pagination
    const total = await prisma.product.count({ where: whereClause });

    // Get shows of the specified brand
    const shows = await prisma.product.findMany({
      where: whereClause,
      include: {
        showType: true,
        brand: true,
        category: true,
        showProducts: {
          include: {
            product: {
              include: {
                brand: true,
                category: true,
                unitProduct: true,
              },
            },
          },
        },
      },
      orderBy: { title: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return res.status(200).json({
      shows,
      brand, // Include brand info in response
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Error fetching shows by brand:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/* GET shows by type */
showsRouter.get("/type/:typeId", async (req, res) => {
  try {
    const { typeId } = req.params;
    const { page, pageSize } = showFilterSchema.parse(req.query);

    // Verify show type exists
    const showType = await prisma.showType.findUnique({
      where: { id: typeId },
    });

    if (!showType) {
      return res.status(404).json({ message: "Show type not found" });
    }

    // Get total count for pagination
    const total = await prisma.product.count({
      where: {
        isShow: true,
        showTypeId: typeId,
      },
    });

    // Get shows of the specified type
    const shows = await prisma.product.findMany({
      where: {
        isShow: true,
        showTypeId: typeId,
      },
      include: {
        showType: true,
        brand: true,
        category: true,
        showProducts: {
          include: {
            product: {
              include: {
                brand: true,
                category: true,
                unitProduct: true,
              },
            },
          },
        },
      },
      orderBy: { title: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return res.status(200).json({
      shows,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Error fetching shows by type:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/* GET a single show */
showsRouter.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Get the show with all its details
    const show = await prisma.product.findFirst({
      where: {
        id,
        isShow: true,
      },
      include: {
        showType: true,
        brand: true,
        category: true,
        colors: true,
        effects: true,
        showProducts: {
          include: {
            product: {
              include: {
                brand: true,
                category: true,
                unitProduct: true,
                colors: true,
                effects: true,
              },
            },
          },
        },
      },
    });

    if (!show) {
      return res.status(404).json({ message: "Show not found" });
    }

    return res.status(200).json(show);
  } catch (error) {
    console.error("Error fetching show:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/* CREATE a new show (Admin only) */
showsRouter.post("/", authenticationAdminMiddleware, async (req, res) => {
  try {
    const validatedData = createShowSchema.safeParse(req.body);

    if (!validatedData.success) {
      return res.status(400).json({
        message: "Invalid show data",
        errors: validatedData.error.errors,
      });
    }

    const { products, ...showData } = validatedData.data;
    for (const product of products) {
      if (product.isUnit) {
        const existingProduct = await prisma.product.findUnique({
          where: { id: product.productId },
          include: { unitProduct: true },
        });

        if (!existingProduct || !existingProduct.unitProduct) {
          return res.status(400).json({
            message: `Product with ID ${product.productId} doesn't have unit products available`,
          });
        }
      }
    }

    // Validate that all product IDs exist and aren't already shows
    const productIds = products.map((p) => p.productId);
    const existingProducts = await prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
      select: {
        id: true,
        isShow: true,
      },
    });

    // Check if all products exist
    if (existingProducts.length !== productIds.length) {
      return res.status(400).json({
        message: "Some product IDs don't exist",
      });
    }

    // Check if any products are already shows
    const showProducts = existingProducts.filter((p) => p.isShow);
    if (showProducts.length > 0) {
      return res.status(400).json({
        message: "Cannot add a show as a component of another show",
        showProductIds: showProducts.map((p) => p.id),
      });
    }

    // Create the show in a transaction
    const show = await prisma.$transaction(async (tx) => {
      // Generate a unique show SKU
      const showSku = await generateUniqueShowSku(tx);

      // Create the show product
      const newShow = await tx.product.create({
        data: {
          title: showData.title,
          description: showData.description,
          image: showData.image,
          videoURL: showData.videoURL,
          inStock: showData.inStock ?? true,
          sku: showSku,
          isShow: true,
          package: [1], // Set a default package for the show
          casePrice: new Decimal(showData.casePrice),
          showType: {
            connect: { id: showData.showTypeId },
          },
          brand: {
            connect: { id: showData.brandId },
          },
          category: {
            connect: { id: showData.categoryId },
          },
        },
      });

      // Create relationships with included products
      for (const product of products) {
        await tx.showProduct.create({
          data: {
            showId: newShow.id,
            productId: product.productId,
            quantity: product.quantity,
            isUnit: product.isUnit,
            notes: product.notes,
          },
        });
      }

      // Return the show with its products
      return tx.product.findUnique({
        where: { id: newShow.id },
        include: {
          showType: true,
          brand: true,
          category: true,
          showProducts: {
            include: {
              product: {
                include: {
                  brand: true,
                  category: true,
                  unitProduct: true,
                },
              },
            },
          },
        },
      });
    });

    return res.status(201).json(show);
  } catch (error) {
    console.error("Error creating show:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

/* UPDATE a show (Admin only) */
showsRouter.put("/:id", authenticationAdminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateShowSchema.safeParse(req.body);

    if (!validatedData.success) {
      return res.status(400).json({
        message: "Invalid show data",
        errors: validatedData.error.errors,
      });
    }

    const { products, ...showData } = validatedData.data;

    // Verify this is a show
    const existingShow = await prisma.product.findFirst({
      where: {
        id,
        isShow: true,
      },
    });

    if (!existingShow) {
      return res.status(404).json({ message: "Show not found" });
    }
    // If updating products, validate them
    if (products && products.length > 0) {
      // Validate unit products have corresponding unit products in the database
      for (const product of products) {
        if (product.isUnit) {
          // Check if the product has a unit product
          const existingProduct = await prisma.product.findUnique({
            where: { id: product.productId },
            include: { unitProduct: true },
          });

          if (!existingProduct || !existingProduct.unitProduct) {
            return res.status(400).json({
              message: `Product with ID ${product.productId} doesn't have unit products available`,
            });
          }
        }
      }

      // Validate that all product IDs exist and aren't already shows
      const productIds = products.map((p) => p.productId);
      const existingProducts = await prisma.product.findMany({
        where: {
          id: { in: productIds },
        },
        select: {
          id: true,
          isShow: true,
        },
      });

      // Check if all products exist
      if (existingProducts.length !== productIds.length) {
        return res.status(400).json({
          message: "Some product IDs don't exist",
        });
      }

      // Check if any products are already shows (excluding this show itself)
      const showProducts = existingProducts.filter(
        (p) => p.isShow && p.id !== id
      );
      if (showProducts.length > 0) {
        return res.status(400).json({
          message: "Cannot add a show as a component of another show",
          showProductIds: showProducts.map((p) => p.id),
        });
      }
    }

    // Create update data
    const updateData: any = {};

    if (showData.title !== undefined) updateData.title = showData.title;
    if (showData.description !== undefined)
      updateData.description = showData.description;
    if (showData.image !== undefined) updateData.image = showData.image;
    if (showData.videoURL !== undefined)
      updateData.videoURL = showData.videoURL;
    if (showData.inStock !== undefined) updateData.inStock = showData.inStock;
    if (showData.showTypeId !== undefined)
      updateData.showType = { connect: { id: showData.showTypeId } };
    if (showData.brandId !== undefined)
      updateData.brand = { connect: { id: showData.brandId } };
    if (showData.categoryId !== undefined)
      updateData.category = { connect: { id: showData.categoryId } };
    if (showData.casePrice !== undefined)
      updateData.casePrice = new Decimal(showData.casePrice);

    // Start a transaction to handle the update atomically
    const updatedShow = await prisma.$transaction(async (tx) => {
      // First, update the show details
      const updatedShowData = await tx.product.update({
        where: { id },
        data: updateData,
      });

      // If products are provided, update the show products
      if (products && products.length > 0) {
        // Delete existing relationships
        await tx.showProduct.deleteMany({
          where: { showId: id },
        });

        // Create new relationships
        for (const product of products) {
          await tx.showProduct.create({
            data: {
              showId: id,
              productId: product.productId,
              quantity: product.quantity,
              isUnit: product.isUnit,
              notes: product.notes || null,
            },
          });
        }
      }

      // Return the updated show
      return tx.product.findUnique({
        where: { id },
        include: {
          showType: true,
          brand: true,
          category: true,
          showProducts: {
            include: {
              product: {
                include: {
                  brand: true,
                  category: true,
                  unitProduct: true,
                },
              },
            },
          },
        },
      });
    });

    return res.status(200).json(updatedShow);
  } catch (error) {
    console.error("Error updating show:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

/* DELETE a show (Admin only) */
showsRouter.delete("/:id", authenticationAdminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify this is a show
    const show = await prisma.product.findFirst({
      where: {
        id,
        isShow: true,
      },
      include: {
        purchaseItems: true, // Check if show is in any purchases
      },
    });

    if (!show) {
      return res.status(404).json({ message: "Show not found" });
    }

    // Check if show is in purchase records
    if (show.purchaseItems.length > 0) {
      return res.status(409).json({
        message: "Cannot delete show because it has been purchased",
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.showProduct.deleteMany({
        where: { showId: id },
      });
      await tx.product.delete({
        where: { id },
      });
    });

    return res.status(204).send();
  } catch (error) {
    console.error("Error deleting show:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});
/* GET all show types */
showsRouter.get("/types/all", async (req, res) => {
  try {
    const types = await prisma.showType.findMany({
      orderBy: { name: "asc" },
    });
    return res.status(200).json(types);
  } catch (error) {
    console.error("Error fetching show types:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/* CREATE a show type (Admin only) */
showsRouter.post("/types", authenticationAdminMiddleware, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Name is required" });
    }

    // Check if type with this name already exists
    const existingType = await prisma.showType.findFirst({
      where: { name },
    });

    if (existingType) {
      return res
        .status(409)
        .json({ message: "A show type with this name already exists" });
    }

    const showType = await prisma.showType.create({
      data: {
        name,
        description,
      },
    });
    return res.status(201).json(showType);
  } catch (error) {
    console.error("Error creating show type:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/* UPDATE a show type (Admin only) */
showsRouter.put(
  "/types/:id",
  authenticationAdminMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      if (!name || name.trim() === "") {
        return res.status(400).json({ message: "Name is required" });
      }

      // Check if type exists
      const existingType = await prisma.showType.findUnique({
        where: { id },
      });

      if (!existingType) {
        return res.status(404).json({ message: "Show type not found" });
      }

      // Check if another type has this name
      const duplicateName = await prisma.showType.findFirst({
        where: {
          name,
          id: { not: id },
        },
      });

      if (duplicateName) {
        return res
          .status(409)
          .json({ message: "A show type with this name already exists" });
      }

      const showType = await prisma.showType.update({
        where: { id },
        data: {
          name,
          description,
        },
      });
      return res.status(200).json(showType);
    } catch (error) {
      console.error("Error updating show type:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

/* DELETE a show type (Admin only) */
showsRouter.delete(
  "/types/:id",
  authenticationAdminMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Check if there are any shows using this type
      const showsUsingType = await prisma.product.count({
        where: {
          isShow: true,
          showTypeId: id,
        },
      });

      if (showsUsingType > 0) {
        return res.status(409).json({
          message:
            "Cannot delete this show type because it is being used by existing shows",
        });
      }

      // Delete the show type
      await prisma.showType.delete({
        where: { id },
      });

      return res.status(204).send();
    } catch (error) {
      console.error("Error deleting show type:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Helper function to generate a unique SKU for shows
async function generateUniqueShowSku(tx: any) {
  // Find the highest show number by extracting the numeric part from existing SKUs
  const showProducts = await tx.product.findMany({
    where: {
      isShow: true,
      sku: {
        startsWith: "SHOW-",
      },
    },
    select: { sku: true },
  });

  // Extract the numeric parts and find the highest one
  const showNumbers = showProducts
    .map((product: { sku: string }) => {
      const match = product.sku.match(/SHOW-(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((num: number) => !isNaN(num));

  const highestNumber = showNumbers.length > 0 ? Math.max(...showNumbers) : 0;
  const nextNumber = highestNumber + 1;

  // Generate the new SKU in the format "SHOW-n"
  return `SHOW-${nextNumber}`;
}

export { showsRouter };
