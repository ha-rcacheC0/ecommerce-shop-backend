import { Router } from "express";
import { prisma } from "../../prisma/db.setup";
import { validateRequestBody } from "zod-express-middleware";
import { z } from "zod";
import { Decimal } from "@prisma/client/runtime/library";

const showsRouter = Router();

// GET all shows - Added sorting and pagination
showsRouter.get("/", async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);
    const take = Number(pageSize);

    const shows = await prisma.product.findMany({
      where: {
        isShow: true,
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
              },
            },
          },
        },
      },
      orderBy: { title: "asc" }, // Sort by title for consistency
      skip: isNaN(skip) ? 0 : skip,
      take: isNaN(take) ? 20 : take,
    });

    // Get the total count for pagination
    const total = await prisma.product.count({
      where: {
        isShow: true,
      },
    });

    return res.status(200).json({
      shows,
      pagination: {
        total,
        page: Number(page),
        pageSize: Number(pageSize),
        totalPages: Math.ceil(total / Number(pageSize)),
      },
    });
  } catch (error) {
    console.error("Error fetching shows:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// GET shows by type - Added sorting and pagination
showsRouter.get("/type/:typeId", async (req, res) => {
  const { typeId } = req.params;
  const { page = 1, pageSize = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(pageSize);
  const take = Number(pageSize);

  try {
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
              },
            },
          },
        },
      },
      orderBy: { title: "asc" },
      skip: isNaN(skip) ? 0 : skip,
      take: isNaN(take) ? 20 : take,
    });

    // Get the total count for pagination
    const total = await prisma.product.count({
      where: {
        isShow: true,
        showTypeId: typeId,
      },
    });

    return res.status(200).json({
      shows,
      pagination: {
        total,
        page: Number(page),
        pageSize: Number(pageSize),
        totalPages: Math.ceil(total / Number(pageSize)),
      },
    });
  } catch (error) {
    console.error("Error fetching shows by type:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// GET a single show - No changes needed
showsRouter.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
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

// Create a new show - Improved validation
const createShowSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  price: z.number().positive("Price must be positive"),
  image: z.string().optional(),
  videoURL: z.string().url().optional(),
  inStock: z.boolean().default(true),
  showTypeId: z.string(),
  brandId: z.string(),
  categoryId: z.string(),
  products: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().int().positive(),
        notes: z.string().optional(),
      })
    )
    .min(1, "At least one product is required"),
});

showsRouter.post(
  "/",
  validateRequestBody(createShowSchema),
  async (req, res) => {
    const { products, ...showData } = req.body;
    try {
      // Validate that all product IDs exist and aren't already shows
      const productIds = products.map((p) => p.productId);
      const existingProducts = await prisma.product.findMany({
        where: {
          id: {
            in: productIds,
          },
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
        const newShow = await tx.product.create({
          data: {
            ...showData,
            isShow: true,
            package: [1], // Set a default package for the show
            casePrice: new Decimal(showData.price),
            sku: await generateUniqueShowSku(tx),
          },
        });

        for (const product of products) {
          await tx.showProduct.create({
            data: {
              showId: newShow.id,
              productId: product.productId,
              quantity: product.quantity,
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
      return res
        .status(500)
        .json({ message: "Internal server error", error: String(error) });
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
  const newSku = `SHOW-${nextNumber}`;

  return newSku;
}

// Update a show - Improved validation
showsRouter.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { products, ...showData } = req.body;

  try {
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
    if (products && Array.isArray(products)) {
      // Validate that all product IDs exist and aren't already shows
      const productIds = products.map((p) => p.productId);
      const existingProducts = await prisma.product.findMany({
        where: {
          id: {
            in: productIds,
          },
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

    // Start a transaction to handle the update atomically
    const updatedShow = await prisma.$transaction(async (tx) => {
      // First, update the show details
      const updatedShowData = await tx.product.update({
        where: {
          id,
        },
        data: {
          ...showData,
          casePrice: showData.price ? new Decimal(showData.price) : undefined,
        },
      });

      // If products are provided, update the show products
      if (products && Array.isArray(products)) {
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
    return res
      .status(500)
      .json({ message: "Internal server error", error: String(error) });
  }
});

// Delete a show - No changes needed
showsRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Verify this is a show
    const show = await prisma.product.findFirst({
      where: {
        id,
        isShow: true,
      },
    });

    if (!show) {
      return res.status(404).json({ message: "Show not found" });
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

// GET all show types - No changes needed
showsRouter.get("/types/all", async (req, res) => {
  try {
    const types = await prisma.showType.findMany();
    return res.status(200).json(types);
  } catch (error) {
    console.error("Error fetching show types:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Create a show type - Improved validation
showsRouter.post("/types", async (req, res) => {
  const { name, description } = req.body;

  if (!name || name.trim() === "") {
    return res.status(400).json({ message: "Name is required" });
  }

  try {
    // Check if type with this name already exists
    const existingType = await prisma.showType.findFirst({
      where: { name },
    });

    if (existingType) {
      return res
        .status(400)
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

// Update a show type - Improved validation
showsRouter.put("/types/:id", async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  if (!name || name.trim() === "") {
    return res.status(400).json({ message: "Name is required" });
  }

  try {
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
        .status(400)
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
});

// Delete a show type - No changes needed
showsRouter.delete("/types/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Check if there are any shows using this type
    const showsUsingType = await prisma.product.count({
      where: {
        isShow: true,
        showTypeId: id,
      },
    });

    if (showsUsingType > 0) {
      return res.status(400).json({
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
});

export { showsRouter };
