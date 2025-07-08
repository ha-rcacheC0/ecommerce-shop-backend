// Updated apparel router to work with variants

import { Router } from "express";
import { prisma } from "../../prisma/db.setup";
import { Decimal } from "@prisma/client/runtime/library";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { calcUnitPrice } from "../utils/creation-utils";
import { authenticationAdminMiddleware } from "../utils/auth-utils";

const apparelRouter = Router();

// Helper function to generate next apparel SKU
const generateNextApparelSku = async (tx: any): Promise<string> => {
  const skuCounter = await tx.skuCounter.upsert({
    where: { id: "apparel" },
    update: {
      counter: {
        increment: 1,
      },
    },
    create: {
      id: "apparel",
      counter: 1,
    },
  });

  return `APP-${skuCounter.counter.toString().padStart(4, "0")}`;
};

// Helper function to generate variant SKU
const generateVariantSku = (
  baseSku: string,
  variant: any,
  colorMap: Map<string, string>
): string => {
  const genderCode = variant.gender[0]; // M, F, U
  const sizeCode = variant.size.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

  let colorCode = "";
  if (variant.colorId && colorMap.has(variant.colorId)) {
    colorCode = `-${colorMap.get(variant.colorId)}`;
  }

  return `${baseSku}-${sizeCode}-${genderCode}${colorCode}`;
};
// Schema for filtering products with variants
const filterSchema = z.object({
  page: z.coerce.number().positive().default(1),
  pageSize: z.coerce.number().positive().default(20),
  searchTitle: z.string().optional(),
  brands: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
  colors: z.array(z.string()).optional(),
  apparelTypes: z.array(z.string()).optional(),
  genders: z.array(z.string()).optional(),
  sizes: z.array(z.string()).optional(),
  inStock: z.boolean().optional(),
});

// Schema for creating apparel products with variants
const apparelProductCreateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  image: z.string().default("placeholder"),
  casePrice: z.string().refine((val) => !isNaN(parseFloat(val)), {
    message: "Case price must be a valid number",
  }),
  inStock: z.boolean().default(true),
  package: z.string().refine(
    (val) => {
      try {
        const nums = val.split(",").map(Number);
        return nums.length >= 1 && nums.every((n) => !isNaN(n) && n > 0);
      } catch (e) {
        return false;
      }
    },
    { message: "Package must be a comma-separated list of positive numbers" }
  ),
  brandId: z.string().min(1, "Brand ID is required"),
  categoryId: z.string().min(1, "Category ID is required"),
  apparelTypeId: z.string().min(1, "Apparel Type ID is required"),
  colors: z.array(z.string()).default([]),
  variants: z
    .array(
      z.object({
        size: z.string().min(1, "Size is required"),
        gender: z.enum(["MALE", "FEMALE", "UNISEX"]),
        colorId: z.string().optional(),
        unitPrice: z.string().refine((val) => !isNaN(parseFloat(val)), {
          message: "Unit price must be a valid number",
        }),
        availableStock: z.number().default(999),
      })
    )
    .min(1, "At least one variant is required"),
});

// Schema for creating individual variants
const variantCreateSchema = z.object({
  sku: z.string().optional(),
  productId: z.string().min(1, "Product ID is required"),
  size: z.string().min(1, "Size is required"),
  gender: z.enum(["MALE", "FEMALE", "UNISEX"]),
  colorId: z.string().optional(),
  unitPrice: z.string().refine((val) => !isNaN(parseFloat(val)), {
    message: "Unit price must be a valid number",
  }),
  availableStock: z.number().default(999),
  additionalSku: z.string().optional(),
  weight: z.string().optional(),
  isActive: z.boolean().default(true),
});

/* GET ALL APPAREL PRODUCTS WITH VARIANTS */
apparelRouter.get("/", async function (req, res) {
  try {
    const validatedQuery = filterSchema.safeParse({
      ...req.query,
      brands: Array.isArray(req.query.brands)
        ? req.query.brands
        : req.query.brands
        ? [req.query.brands]
        : undefined,
      categories: Array.isArray(req.query.categories)
        ? req.query.categories
        : req.query.categories
        ? [req.query.categories]
        : undefined,
      colors: Array.isArray(req.query.colors)
        ? req.query.colors
        : req.query.colors
        ? [req.query.colors]
        : undefined,
      apparelTypes: Array.isArray(req.query.apparelTypes)
        ? req.query.apparelTypes
        : req.query.apparelTypes
        ? [req.query.apparelTypes]
        : undefined,
      genders: Array.isArray(req.query.genders)
        ? req.query.genders
        : req.query.genders
        ? [req.query.genders]
        : undefined,
      sizes: Array.isArray(req.query.sizes)
        ? req.query.sizes
        : req.query.sizes
        ? [req.query.sizes]
        : undefined,
      inStock:
        req.query.inStock === undefined
          ? undefined
          : req.query.inStock === "true",
    });

    if (!validatedQuery.success) {
      return res.status(400).json({
        message: "Invalid query parameters",
        errors: validatedQuery.error.errors,
      });
    }

    const {
      page,
      pageSize,
      searchTitle,
      brands,
      categories,
      colors,
      apparelTypes,
      genders,
      sizes,
      inStock,
    } = validatedQuery.data;

    // Build where clause for filtering
    const whereClause: Prisma.ProductWhereInput = {
      isApparel: true,
    };

    if (inStock !== undefined) {
      whereClause.inStock = inStock;
    }

    if (searchTitle) {
      whereClause.OR = [
        {
          title: {
            contains: searchTitle,
            mode: "insensitive" as Prisma.QueryMode,
          },
        },
        {
          sku: {
            contains: searchTitle,
            mode: "insensitive" as Prisma.QueryMode,
          },
        },
      ];
    }

    if (brands?.length) {
      whereClause.brand = { name: { in: brands } };
    }

    if (categories?.length) {
      whereClause.category = { name: { in: categories } };
    }

    if (colors?.length) {
      whereClause.colors = { some: { name: { in: colors } } };
    }

    if (apparelTypes?.length) {
      whereClause.apparelType = { name: { in: apparelTypes } };
    }

    // Filter by variants if gender or size filters are applied
    if (genders?.length || sizes?.length) {
      const variantWhere: Prisma.ProductVariantWhereInput = {};
      if (genders?.length) {
        variantWhere.gender = { in: genders as any };
      }
      if (sizes?.length) {
        variantWhere.size = { in: sizes };
      }
      whereClause.variants = { some: variantWhere };
    }

    // Get total count for pagination
    const totalCount = await prisma.product.count({ where: whereClause });
    const totalPages = Math.ceil(totalCount / pageSize);

    // Get filtered products with variants
    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        brand: true,
        category: true,
        colors: { select: { id: true, name: true } },
        effects: { select: { id: true, name: true } },
        unitProduct: true,
        apparelType: true,
        variants: {
          include: {
            color: { select: { id: true, name: true } },
          },
          where: { isActive: true },
        },
      },
      orderBy: {
        sku: "asc",
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return res.status(200).json({
      contents: products,
      hasMore: page < totalPages,
      totalPages,
      currentPage: page,
      totalItems: totalCount,
    });
  } catch (error) {
    console.error("Error fetching apparel products:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/* GET ONE APPAREL PRODUCT BY ID WITH VARIANTS */
apparelRouter.get("/:id", async function (req, res) {
  try {
    const { id } = req.params;

    const product = await prisma.product.findFirst({
      where: { id, isApparel: true },
      include: {
        brand: true,
        category: true,
        colors: { select: { id: true, name: true } },
        effects: { select: { id: true, name: true } },
        apparelType: true,
        variants: {
          include: {
            color: { select: { id: true, name: true } },
          },
          where: { isActive: true },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ message: "Apparel product not found" });
    }
    return res.status(200).json(product);
  } catch (error) {
    console.error("Error fetching apparel product:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/* CREATE NEW APPAREL PRODUCT WITH VARIANTS (Admin only) */
apparelRouter.post(
  "/products",
  authenticationAdminMiddleware,
  async function (req, res) {
    try {
      const validatedData = apparelProductCreateSchema.safeParse(req.body);

      if (!validatedData.success) {
        return res.status(400).json({
          message: "Invalid apparel product data",
          errors: validatedData.error.errors,
        });
      }

      const {
        title,
        description,
        image,
        casePrice,
        inStock,
        package: packageStr,
        brandId,
        categoryId,
        apparelTypeId,
        colors,
        variants,
      } = validatedData.data;

      const packageArray = packageStr.split(",").map(Number);

      const result = await prisma.$transaction(async (tx) => {
        // Generate next serial SKU
        const baseSku = await generateNextApparelSku(tx);
        console.log("Generated base SKU:", baseSku);

        // Fetch color objects for variant SKU generation
        const colorMap = new Map<string, string>();
        if (colors.length > 0) {
          const colorObjects = await tx.color.findMany({
            where: { id: { in: colors } },
            select: { id: true, name: true },
          });

          colorObjects.forEach((color) => {
            const colorAbbrev = color.name
              .replace(/[^a-zA-Z0-9]/g, "")
              .substring(0, 3)
              .toUpperCase();
            colorMap.set(color.id, colorAbbrev);
          });
        }

        // Generate all variant SKUs and check for conflicts
        const variantSkus = variants.map((variant) =>
          generateVariantSku(baseSku, variant, colorMap)
        );

        console.log("Generated variant SKUs:", variantSkus);

        // Check if any variant SKUs already exist
        const existingVariants = await tx.productVariant.findMany({
          where: { sku: { in: variantSkus } },
          select: { sku: true },
        });

        if (existingVariants.length > 0) {
          throw new Error(
            `SKU conflict: ${existingVariants
              .map((v) => v.sku)
              .join(", ")} already exist`
          );
        }

        // Create the base product
        const product = await tx.product.create({
          data: {
            sku: baseSku,
            title,
            description,
            image: image || "placeholder",
            casePrice: new Decimal(casePrice),
            inStock,
            package: packageArray,
            isCaseBreakable: true,
            isApparel: true,
            brand: { connect: { id: brandId } },
            category: { connect: { id: categoryId } },
            apparelType: { connect: { id: apparelTypeId } },
            colors: {
              connect: colors.map((id) => ({ id })),
            },
          },
        });

        // Create variants with generated SKUs
        const createdVariants = await Promise.all(
          variants.map((variant) => {
            const variantSku = generateVariantSku(baseSku, variant, colorMap);

            return tx.productVariant.create({
              data: {
                sku: variantSku,
                productId: product.id,
                size: variant.size,
                gender: variant.gender,
                colorId: variant.colorId || null,
                unitPrice: new Decimal(variant.unitPrice),
                availableStock: variant.availableStock,
              },
              include: {
                color: { select: { id: true, name: true } },
              },
            });
          })
        );

        return { product, variants: createdVariants };
      });

      return res.status(201).json(result);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          return res.status(409).json({
            message: "A product or variant with this SKU already exists",
          });
        }
      }
      console.error("Error creating apparel product:", error);
      return res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  }
);

/* DELETE APPAREL PRODUCT AND ALL ITS VARIANTS (Admin only) */
apparelRouter.delete(
  "/products/:id",
  authenticationAdminMiddleware,
  async function (req, res) {
    try {
      const { id } = req.params;

      const product = await prisma.product.findFirst({
        where: {
          id,
          isApparel: true,
        },
        include: {
          variants: true,
          _count: {
            select: {
              cartProducts: true,
              purchaseItems: true,
              showProducts: true,
            },
          },
        },
      });

      if (!product) {
        return res.status(404).json({
          message: "Apparel product not found",
        });
      }

      // Check if product is being used in any carts, purchases, or shows
      const { cartProducts, purchaseItems, showProducts } = product._count;

      if (cartProducts > 0 || purchaseItems > 0 || showProducts > 0) {
        return res.status(409).json({
          message: `Cannot delete product. It is currently being used in ${
            cartProducts > 0 ? `${cartProducts} cart(s)` : ""
          }${
            cartProducts > 0 && (purchaseItems > 0 || showProducts > 0)
              ? ", "
              : ""
          }${purchaseItems > 0 ? `${purchaseItems} purchase(s)` : ""}${
            purchaseItems > 0 && showProducts > 0 ? ", " : ""
          }${showProducts > 0 ? `${showProducts} show(s)` : ""}.`,
        });
      }

      await prisma.$transaction(async (tx) => {
        await tx.productVariant.deleteMany({
          where: { productId: id },
        });

        await tx.product.update({
          where: { id },
          data: {
            colors: {
              set: [],
            },
            effects: {
              set: [],
            },
          },
        });

        await tx.product.delete({
          where: { id },
        });
      });

      return res.status(200).json({
        message: "Apparel product and all variants deleted successfully",
        deletedVariantsCount: product.variants.length,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          return res.status(404).json({
            message: "Product not found or already deleted",
          });
        }
        if (error.code === "P2003") {
          return res.status(409).json({
            message:
              "Cannot delete product due to existing references. Please check for cart items, purchases, or other dependencies.",
          });
        }
      }

      console.error("Error deleting apparel product:", error);
      return res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  }
);

/* CREATE NEW VARIANT FOR EXISTING PRODUCT (Admin only) */
apparelRouter.post(
  "/variants",
  authenticationAdminMiddleware,
  async function (req, res) {
    try {
      const validatedData = variantCreateSchema.safeParse(req.body);

      if (!validatedData.success) {
        return res.status(400).json({
          message: "Invalid variant data",
          errors: validatedData.error.errors,
        });
      }

      const {
        sku,
        productId,
        size,
        gender,
        colorId,
        unitPrice,
        availableStock,
        additionalSku,
        isActive,
      } = validatedData.data;

      const result = await prisma.$transaction(async (tx) => {
        // If no SKU provided, generate one based on the parent product
        let finalSku = sku;
        if (!finalSku) {
          const product = await tx.product.findUnique({
            where: { id: productId },
            select: { sku: true },
          });

          if (!product) {
            throw new Error("Product not found");
          }

          // Get color info if needed
          const colorMap = new Map<string, string>();
          if (colorId) {
            const color = await tx.color.findUnique({
              where: { id: colorId },
              select: { name: true },
            });
            if (color) {
              const colorAbbrev = color.name
                .replace(/[^a-zA-Z0-9]/g, "")
                .substring(0, 3)
                .toUpperCase();
              colorMap.set(colorId, colorAbbrev);
            }
          }

          // Generate variant SKU based on parent product SKU
          finalSku = generateVariantSku(
            product.sku,
            { size, gender, colorId },
            colorMap
          );
        }

        // Check if SKU already exists
        const existingVariant = await tx.productVariant.findUnique({
          where: { sku: finalSku },
        });

        if (existingVariant) {
          throw new Error(`A variant with SKU ${finalSku} already exists`);
        }

        const variant = await tx.productVariant.create({
          data: {
            sku: finalSku,
            productId,
            size,
            gender,
            colorId: colorId || null,
            unitPrice: new Decimal(unitPrice),
            availableStock,
            additionalSku,
            isActive,
          },
          include: {
            color: { select: { id: true, name: true } },
          },
        });

        return variant;
      });

      return res.status(201).json(result);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          return res
            .status(409)
            .json({ message: "A variant with this SKU already exists" });
        }
      }
      console.error("Error creating variant:", error);
      return res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  }
);

// Utility endpoint to get next SKU preview (useful for frontend)
apparelRouter.get("/sku/preview", async function (req, res) {
  try {
    const currentCounter = await prisma.skuCounter.findUnique({
      where: { id: "apparel" },
    });

    const nextNumber = (currentCounter?.counter || 0) + 1;
    const nextSku = `APP-${nextNumber.toString().padStart(4, "0")}`;

    return res.status(200).json({ nextSku });
  } catch (error) {
    console.error("Error getting SKU preview:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/* UPDATE VARIANT BY ID (Admin only) */
apparelRouter.put(
  "/variants/:id",
  authenticationAdminMiddleware,
  async function (req, res) {
    try {
      const { id } = req.params;
      const validatedData = variantCreateSchema.partial().safeParse(req.body);

      if (!validatedData.success) {
        return res.status(400).json({
          message: "Invalid variant data",
          errors: validatedData.error.errors,
        });
      }

      const updateData: any = {};
      const {
        sku,
        size,
        gender,
        colorId,
        unitPrice,
        availableStock,
        additionalSku,
        isActive,
      } = validatedData.data;

      if (sku !== undefined) updateData.sku = sku;
      if (size !== undefined) updateData.size = size;
      if (gender !== undefined) updateData.gender = gender;
      if (colorId !== undefined) updateData.colorId = colorId;
      if (unitPrice !== undefined)
        updateData.unitPrice = new Decimal(unitPrice);
      if (availableStock !== undefined)
        updateData.availableStock = availableStock;
      if (additionalSku !== undefined) updateData.additionalSku = additionalSku;

      if (isActive !== undefined) updateData.isActive = isActive;

      const variant = await prisma.productVariant.update({
        where: { id },
        data: updateData,
        include: {
          color: { select: { id: true, name: true } },
        },
      });

      return res.status(200).json(variant);
    } catch (error) {
      console.error("Error updating variant:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

/* DELETE VARIANT BY ID (Admin only) */
apparelRouter.delete(
  "/variants/:id",
  authenticationAdminMiddleware,
  async function (req, res) {
    try {
      const { id } = req.params;

      await prisma.productVariant.delete({
        where: { id },
      });

      return res.status(204).send();
    } catch (error) {
      console.error("Error deleting variant:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

export { apparelRouter };

/* APPAREL TYPES ROUTES */

/* GET ALL APPAREL TYPES */
apparelRouter.get("/types/all", async function (req, res) {
  try {
    const apparelTypes = await prisma.apparelType.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // Transform the data to include productCount
    const transformedTypes = apparelTypes.map((type) => ({
      id: type.id,
      name: type.name,
      description: type.description,
      productCount: type._count.products,
    }));

    return res.status(200).json(transformedTypes);
  } catch (error) {
    console.error("Error fetching apparel types:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/* GET ONE APPAREL TYPE BY ID */
apparelRouter.get("/types/:id", async function (req, res) {
  try {
    const { id } = req.params;

    const apparelType = await prisma.apparelType.findUnique({
      where: { id },
      include: {
        products: {
          select: {
            id: true,
            sku: true,
            title: true,
          },
        },
      },
    });

    if (!apparelType) {
      return res.status(404).json({ message: "Apparel type not found" });
    }

    return res.status(200).json(apparelType);
  } catch (error) {
    console.error("Error fetching apparel type:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/* CREATE NEW APPAREL TYPE (Admin only) */
apparelRouter.post(
  "/types",
  authenticationAdminMiddleware,
  async function (req, res) {
    try {
      const { name, description } = req.body;

      if (!name || typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ message: "Name is required" });
      }

      const apparelType = await prisma.apparelType.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null,
        },
      });

      return res.status(201).json(apparelType);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          return res.status(409).json({
            message: "An apparel type with this name already exists",
          });
        }
      }
      console.error("Error creating apparel type:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

/* UPDATE APPAREL TYPE BY ID (Admin only) */
apparelRouter.put(
  "/types/:id",
  authenticationAdminMiddleware,
  async function (req, res) {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      if (!name || typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ message: "Name is required" });
      }

      // Check if apparel type exists
      const existingType = await prisma.apparelType.findUnique({
        where: { id },
      });

      if (!existingType) {
        return res.status(404).json({ message: "Apparel type not found" });
      }

      const updatedType = await prisma.apparelType.update({
        where: { id },
        data: {
          name: name.trim(),
          description: description?.trim() || null,
        },
      });

      return res.status(200).json(updatedType);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          return res.status(409).json({
            message: "An apparel type with this name already exists",
          });
        }
      }
      console.error("Error updating apparel type:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

/* DELETE APPAREL TYPE BY ID (Admin only) */
apparelRouter.delete(
  "/types/:id",
  authenticationAdminMiddleware,
  async function (req, res) {
    try {
      const { id } = req.params;

      // Check if apparel type exists and has products
      const apparelType = await prisma.apparelType.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              products: true,
            },
          },
        },
      });

      if (!apparelType) {
        return res.status(404).json({ message: "Apparel type not found" });
      }

      // Prevent deletion if there are products using this type
      if (apparelType._count.products > 0) {
        return res.status(409).json({
          message: `Cannot delete apparel type. ${apparelType._count.products} product(s) are using this type.`,
        });
      }

      await prisma.apparelType.delete({
        where: { id },
      });

      return res.status(204).send();
    } catch (error) {
      console.error("Error deleting apparel type:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);
