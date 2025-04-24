import { Router } from "express";
import { prisma } from "../../prisma/db.setup";
import { Decimal } from "@prisma/client/runtime/library";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { calcUnitPrice } from "../utils/creation-utils";
import { authenticationAdminMiddleware } from "../utils/auth-utils";

const productRouter = Router();
type ProductCreateInput = Prisma.ProductCreateInput;
type ProductUpdateInput = Prisma.ProductUpdateInput;

// Schema for filtering products
const filterSchema = z.object({
  page: z.coerce.number().positive().default(1),
  pageSize: z.coerce.number().positive().default(20),
  searchTitle: z.string().optional(),
  brands: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
  colors: z.array(z.string()).optional(),
  effects: z.array(z.string()).optional(),
  isShow: z.boolean().optional(),
  inStock: z.boolean().optional(),
});

// Schema for creating/updating products
const productSchemaBase = z.object({
  sku: z.string().min(1, "SKU is required"),
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
  isCaseBreakable: z.boolean().default(true),
  videoURL: z.string().optional(),
  brandId: z.string().min(1, "Brand ID is required"),
  categoryId: z.string().min(1, "Category ID is required"),
  colors: z.array(z.string()).default([]),
  effects: z.array(z.string()).default([]),
});

const productCreateSchema = productSchemaBase;
const productUpdateSchema = productSchemaBase.partial(); // All fields optional for updates

/* GET ALL PRODUCTS */
productRouter.get("/", async function (req, res) {
  try {
    // Parse and validate query parameters
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
      effects: Array.isArray(req.query.effects)
        ? req.query.effects
        : req.query.effects
        ? [req.query.effects]
        : undefined,
      isShow: req.query.isShow === "true",
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
      effects,
      isShow,
      inStock,
    } = validatedQuery.data;

    // Build where clause for filtering
    const whereClause: Prisma.ProductWhereInput = {};

    if (isShow !== undefined) {
      whereClause.isShow = isShow;
    }
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

    if (effects?.length) {
      whereClause.effects = { some: { name: { in: effects } } };
    }

    // Get total count for pagination
    const totalCount = await prisma.product.count({ where: whereClause });
    const totalPages = Math.ceil(totalCount / pageSize);

    // Get filtered products
    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        brand: true,
        category: true,
        colors: { select: { id: true, name: true } },
        effects: { select: { id: true, name: true } },
        unitProduct: true,
        showType: isShow ? true : undefined,
      },
      orderBy: { isShow: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    products.sort((a, b) => {
      const isShowSku = (sku: string) => sku.toUpperCase().startsWith("SHOW-");
      const extractNumber = (sku: string) => {
        const match = sku.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      };
      if (isShowSku(a.sku) && !isShowSku(b.sku)) return 1;
      if (!isShowSku(a.sku) && isShowSku(b.sku)) return -1;
      return extractNumber(a.sku) - extractNumber(b.sku);
    });

    return res.status(200).json({
      contents: products,
      hasMore: page < totalPages,
      totalPages,
      currentPage: page,
      totalItems: totalCount,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/* GET ONE PRODUCT BY ID */
productRouter.get("/:id", async function (req, res) {
  try {
    const { id } = req.params;

    const product = await prisma.product.findFirst({
      where: { id },
      include: {
        brand: true,
        category: true,
        colors: { select: { id: true, name: true } },
        effects: { select: { id: true, name: true } },
        unitProduct: true,
        showType: true,
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

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/* CREATE NEW PRODUCT (Admin only) */
productRouter.post(
  "/",
  authenticationAdminMiddleware,
  async function (req, res) {
    try {
      const validatedData = productCreateSchema.safeParse(req.body);

      if (!validatedData.success) {
        return res.status(400).json({
          message: "Invalid product data",
          errors: validatedData.error.errors,
        });
      }

      const {
        sku,
        title,
        description,
        image,
        casePrice,
        inStock,
        package: packageStr,
        isCaseBreakable,
        videoURL,
        brandId,
        categoryId,
        colors,
        effects,
      } = validatedData.data;

      // Parse package string to array of numbers
      const packageArray = packageStr.split(",").map(Number);

      // Create product data
      const productData: ProductCreateInput = {
        sku,
        title,
        description,
        image: image || "placeholder",
        casePrice: new Decimal(casePrice),
        inStock,
        package: packageArray,
        isCaseBreakable,
        videoURL,
        brand: { connect: { id: brandId } },
        category: { connect: { id: categoryId } },
        colors: {
          connect: colors.map((id) => ({ id })),
        },
        effects: {
          connect: effects.map((id) => ({ id })),
        },
      };

      // Add unit product if case is breakable
      if (isCaseBreakable) {
        productData.unitProduct = {
          create: {
            sku: `${sku}-u`,
            unitPrice: new Decimal(
              calcUnitPrice(parseFloat(casePrice), packageArray[0])
            ),
            package: [1, ...packageArray.slice(1)],
            availableStock: 0,
          },
        };
      }

      // Create new product
      const newProduct = await prisma.product.create({
        data: productData,
        include: {
          brand: true,
          category: true,
          colors: true,
          effects: true,
          unitProduct: true,
        },
      });

      return res.status(201).json(newProduct);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          return res
            .status(409)
            .json({ message: "A product with this SKU already exists" });
        }
      }
      console.error("Error creating product:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

/* UPDATE PRODUCT BY ID (Admin only) */
productRouter.put(
  "/:id",
  authenticationAdminMiddleware,
  async function (req, res) {
    try {
      const { id } = req.params;
      const validatedData = productUpdateSchema.safeParse(req.body);

      if (!validatedData.success) {
        return res.status(400).json({
          message: "Invalid product data",
          errors: validatedData.error.errors,
        });
      }

      // Get existing product to check if it exists
      const existingProduct = await prisma.product.findUnique({
        where: { id },
        include: { unitProduct: true },
      });

      if (!existingProduct) {
        return res.status(404).json({ message: "Product not found" });
      }

      const {
        sku,
        title,
        description,
        image,
        casePrice,
        inStock,
        package: packageStr,
        isCaseBreakable,
        videoURL,
        brandId,
        categoryId,
        colors,
        effects,
      } = validatedData.data;

      // Build update data
      const updateData: ProductUpdateInput = {};

      if (sku !== undefined) updateData.sku = sku;
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (image !== undefined) updateData.image = image;
      if (casePrice !== undefined)
        updateData.casePrice = new Decimal(casePrice);
      if (inStock !== undefined) updateData.inStock = inStock;
      if (videoURL !== undefined) updateData.videoURL = videoURL;
      if (isCaseBreakable !== undefined)
        updateData.isCaseBreakable = isCaseBreakable;

      if (packageStr !== undefined) {
        const packageArray = packageStr.split(",").map(Number);
        updateData.package = packageArray;
      }

      if (brandId !== undefined) {
        updateData.brand = { connect: { id: brandId } };
      }

      if (categoryId !== undefined) {
        updateData.category = { connect: { id: categoryId } };
      }

      if (colors !== undefined) {
        // Disconnect all existing colors and connect new ones
        updateData.colors = {
          set: [],
          connect: colors.map((id) => ({ id })),
        };
      }

      if (effects !== undefined) {
        // Disconnect all existing effects and connect new ones
        updateData.effects = {
          set: [],
          connect: effects.map((id) => ({ id })),
        };
      }

      // Use a transaction to update product and handle unit product
      const updatedProduct = await prisma.$transaction(async (tx) => {
        // Update the product
        const product = await tx.product.update({
          where: { id },
          data: updateData,
          include: {
            brand: true,
            category: true,
            colors: true,
            effects: true,
            unitProduct: true,
          },
        });

        // Handle unit product based on isCaseBreakable flag
        const newIsCaseBreakable =
          isCaseBreakable !== undefined
            ? isCaseBreakable
            : existingProduct.isCaseBreakable;
        const newCasePrice =
          casePrice !== undefined
            ? casePrice
            : existingProduct.casePrice.toString();
        const newPackage =
          packageStr !== undefined
            ? packageStr.split(",").map(Number)
            : existingProduct.package;
        const newSku = sku !== undefined ? sku : existingProduct.sku;

        if (newIsCaseBreakable) {
          if (existingProduct.unitProduct) {
            // Update existing unit product
            await tx.unitProduct.update({
              where: { id: existingProduct.unitProduct.id },
              data: {
                sku: `${newSku}-u`,
                unitPrice: new Decimal(
                  calcUnitPrice(parseFloat(newCasePrice), newPackage[0])
                ),
                package: [1, ...newPackage.slice(1)],
              },
            });
          } else {
            // Create new unit product
            await tx.unitProduct.create({
              data: {
                sku: `${newSku}-u`,
                productId: id,
                unitPrice: new Decimal(
                  calcUnitPrice(parseFloat(newCasePrice), newPackage[0])
                ),
                package: [1, ...newPackage.slice(1)],
                availableStock: 0,
              },
            });
          }
        } else if (!newIsCaseBreakable && existingProduct.unitProduct) {
          // Delete unit product if no longer breakable
          await tx.unitProduct.delete({
            where: { id: existingProduct.unitProduct.id },
          });
        }

        return product;
      });

      return res.status(200).json(updatedProduct);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          return res
            .status(409)
            .json({ message: "A product with this SKU already exists" });
        }
      }
      console.error("Error updating product:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

/* DELETE PRODUCT BY ID (Admin only) */
productRouter.delete(
  "/:id",
  authenticationAdminMiddleware,
  async function (req, res) {
    try {
      const { id } = req.params;

      // Check if product exists
      const existingProduct = await prisma.product.findUnique({
        where: { id },
        include: {
          unitProduct: true,
          cartProducts: true,
          purchaseItems: true,
          showProducts: true,
          includedInShows: true,
        },
      });

      if (!existingProduct) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Check for dependencies before deleting
      if (existingProduct.purchaseItems.length > 0) {
        return res.status(409).json({
          message:
            "Cannot delete product because it's included in purchase records",
        });
      }

      if (existingProduct.includedInShows.length > 0) {
        return res.status(409).json({
          message: "Cannot delete product because it's included in shows",
        });
      }

      // Use transaction to delete product and related records
      await prisma.$transaction(async (tx) => {
        // Delete cart products
        if (existingProduct.cartProducts.length > 0) {
          await tx.cartProduct.deleteMany({
            where: { productId: id },
          });
        }

        // Delete unit product if exists
        if (existingProduct.unitProduct) {
          await tx.unitProduct.delete({
            where: { id: existingProduct.unitProduct.id },
          });
        }

        // Delete show products where this is the show
        if (existingProduct.showProducts.length > 0) {
          await tx.showProduct.deleteMany({
            where: { showId: id },
          });
        }

        // Delete the product
        await tx.product.delete({
          where: { id },
        });
      });

      return res.status(204).send();
    } catch (error) {
      console.error("Error deleting product:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

export { productRouter };
