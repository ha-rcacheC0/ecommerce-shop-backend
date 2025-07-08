// src/routes/metadata.router.ts - Complete version with all CRUD operations

import { Router } from "express";
import { prisma } from "../../prisma/db.setup";
import { authenticationAdminMiddleware } from "../utils/auth-utils";
import { Prisma } from "@prisma/client";

const metadataRouter = Router();

// Get all metadata (public) - Enhanced with product counts
metadataRouter.get("/", async function (req, res) {
  try {
    // Fetch all metadata with product counts in parallel
    const [brands, categories, colors, effects, apparelTypes] =
      await Promise.all([
        prisma.brand.findMany({
          orderBy: { name: "asc" },
          include: {
            _count: {
              select: { products: true },
            },
          },
        }),
        prisma.category.findMany({
          orderBy: { name: "asc" },
          include: {
            _count: {
              select: { products: true },
            },
          },
        }),
        prisma.color.findMany({
          orderBy: { name: "asc" },
          include: {
            _count: {
              select: { products: true },
            },
          },
        }),
        prisma.effect.findMany({
          orderBy: { name: "asc" },
          include: {
            _count: {
              select: { products: true },
            },
          },
        }),
        prisma.apparelType.findMany({
          orderBy: { name: "asc" },
          include: {
            _count: {
              select: { products: true },
            },
          },
        }),
      ]);

    // Transform data to include productCount
    const transformedData = {
      brands: brands.map((brand) => ({
        id: brand.id,
        name: brand.name,
        productCount: brand._count.products,
      })),
      categories: categories.map((category) => ({
        id: category.id,
        name: category.name,
        productCount: category._count.products,
      })),
      colors: colors.map((color) => ({
        id: color.id,
        name: color.name,
        productCount: color._count.products,
      })),
      effects: effects.map((effect) => ({
        id: effect.id,
        name: effect.name,
        productCount: effect._count.products,
      })),
      apparelTypes: apparelTypes.map((effect) => ({
        id: effect.id,
        name: effect.name,
        productCount: effect._count.products,
      })),
    };

    return res.status(200).json(transformedData);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error fetching metadata" });
  }
});

// BRAND ENDPOINTS

// Create brand (Admin only)
metadataRouter.post(
  "/brands",
  authenticationAdminMiddleware,
  async (req, res) => {
    try {
      const { name } = req.body;

      if (!name || typeof name !== "string" || name.trim() === "") {
        return res
          .status(400)
          .json({ message: "Valid brand name is required" });
      }

      const brand = await prisma.brand.create({
        data: { name: name.trim() },
      });

      return res.status(201).json(brand);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return res.status(409).json({ message: "Brand already exists" });
      }
      console.error("Error creating brand:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Update brand (Admin only)
metadataRouter.put(
  "/brands/:id",
  authenticationAdminMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name } = req.body;

      if (!name || typeof name !== "string" || name.trim() === "") {
        return res
          .status(400)
          .json({ message: "Valid brand name is required" });
      }

      const brand = await prisma.brand.update({
        where: { id },
        data: { name: name.trim() },
      });

      return res.status(200).json(brand);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          return res.status(409).json({ message: "Brand name already exists" });
        }
        if (error.code === "P2025") {
          return res.status(404).json({ message: "Brand not found" });
        }
      }
      console.error("Error updating brand:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Delete brand (Admin only)
metadataRouter.delete(
  "/brands/:id",
  authenticationAdminMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Check if brand has products
      const brandWithProducts = await prisma.brand.findUnique({
        where: { id },
        include: { _count: { select: { products: true } } },
      });

      if (!brandWithProducts) {
        return res.status(404).json({ message: "Brand not found" });
      }

      if (brandWithProducts._count.products > 0) {
        return res.status(409).json({
          message: `Cannot delete brand. ${brandWithProducts._count.products} product(s) are using this brand.`,
        });
      }

      await prisma.brand.delete({ where: { id } });
      return res.status(204).send();
    } catch (error) {
      console.error("Error deleting brand:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

// CATEGORY ENDPOINTS

// Create category (Admin only)
metadataRouter.post(
  "/categories",
  authenticationAdminMiddleware,
  async (req, res) => {
    try {
      const { name } = req.body;

      if (!name || typeof name !== "string" || name.trim() === "") {
        return res
          .status(400)
          .json({ message: "Valid category name is required" });
      }

      const category = await prisma.category.create({
        data: { name: name.trim() },
      });

      return res.status(201).json(category);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return res.status(409).json({ message: "Category already exists" });
      }
      console.error("Error creating category:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Update category (Admin only)
metadataRouter.put(
  "/categories/:id",
  authenticationAdminMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name } = req.body;

      if (!name || typeof name !== "string" || name.trim() === "") {
        return res
          .status(400)
          .json({ message: "Valid category name is required" });
      }

      const category = await prisma.category.update({
        where: { id },
        data: { name: name.trim() },
      });

      return res.status(200).json(category);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          return res
            .status(409)
            .json({ message: "Category name already exists" });
        }
        if (error.code === "P2025") {
          return res.status(404).json({ message: "Category not found" });
        }
      }
      console.error("Error updating category:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Delete category (Admin only)
metadataRouter.delete(
  "/categories/:id",
  authenticationAdminMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Check if category has products
      const categoryWithProducts = await prisma.category.findUnique({
        where: { id },
        include: { _count: { select: { products: true } } },
      });

      if (!categoryWithProducts) {
        return res.status(404).json({ message: "Category not found" });
      }

      if (categoryWithProducts._count.products > 0) {
        return res.status(409).json({
          message: `Cannot delete category. ${categoryWithProducts._count.products} product(s) are using this category.`,
        });
      }

      await prisma.category.delete({ where: { id } });
      return res.status(204).send();
    } catch (error) {
      console.error("Error deleting category:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

// COLOR ENDPOINTS

// Create color (Admin only)
metadataRouter.post(
  "/colors",
  authenticationAdminMiddleware,
  async (req, res) => {
    try {
      const { name } = req.body;

      if (!name || typeof name !== "string" || name.trim() === "") {
        return res
          .status(400)
          .json({ message: "Valid color name is required" });
      }

      const color = await prisma.color.create({
        data: { name: name.trim() },
      });

      return res.status(201).json(color);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return res.status(409).json({ message: "Color already exists" });
      }
      console.error("Error creating color:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Update color (Admin only)
metadataRouter.put(
  "/colors/:id",
  authenticationAdminMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name } = req.body;

      if (!name || typeof name !== "string" || name.trim() === "") {
        return res
          .status(400)
          .json({ message: "Valid color name is required" });
      }

      const color = await prisma.color.update({
        where: { id },
        data: { name: name.trim() },
      });

      return res.status(200).json(color);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          return res.status(409).json({ message: "Color name already exists" });
        }
        if (error.code === "P2025") {
          return res.status(404).json({ message: "Color not found" });
        }
      }
      console.error("Error updating color:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Delete color (Admin only)
metadataRouter.delete(
  "/colors/:id",
  authenticationAdminMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Check if color has products or variants
      const [productsCount, variantsCount] = await Promise.all([
        prisma.product.count({
          where: { colors: { some: { id } } },
        }),
        prisma.productVariant.count({
          where: { colorId: id },
        }),
      ]);

      const totalUsage = productsCount + variantsCount;

      if (totalUsage > 0) {
        return res.status(409).json({
          message: `Cannot delete color. ${totalUsage} product(s)/variant(s) are using this color.`,
        });
      }

      await prisma.color.delete({ where: { id } });
      return res.status(204).send();
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        return res.status(404).json({ message: "Color not found" });
      }
      console.error("Error deleting color:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

// EFFECT ENDPOINTS

// Create effect (Admin only)
metadataRouter.post(
  "/effects",
  authenticationAdminMiddleware,
  async (req, res) => {
    try {
      const { name } = req.body;

      if (!name || typeof name !== "string" || name.trim() === "") {
        return res
          .status(400)
          .json({ message: "Valid effect name is required" });
      }

      const effect = await prisma.effect.create({
        data: { name: name.trim() },
      });

      return res.status(201).json(effect);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return res.status(409).json({ message: "Effect already exists" });
      }
      console.error("Error creating effect:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Update effect (Admin only)
metadataRouter.put(
  "/effects/:id",
  authenticationAdminMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name } = req.body;

      if (!name || typeof name !== "string" || name.trim() === "") {
        return res
          .status(400)
          .json({ message: "Valid effect name is required" });
      }

      const effect = await prisma.effect.update({
        where: { id },
        data: { name: name.trim() },
      });

      return res.status(200).json(effect);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          return res
            .status(409)
            .json({ message: "Effect name already exists" });
        }
        if (error.code === "P2025") {
          return res.status(404).json({ message: "Effect not found" });
        }
      }
      console.error("Error updating effect:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Delete effect (Admin only)
metadataRouter.delete(
  "/effects/:id",
  authenticationAdminMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Check if effect has products
      const effectWithProducts = await prisma.effect.findUnique({
        where: { id },
        include: { _count: { select: { products: true } } },
      });

      if (!effectWithProducts) {
        return res.status(404).json({ message: "Effect not found" });
      }

      if (effectWithProducts._count.products > 0) {
        return res.status(409).json({
          message: `Cannot delete effect. ${effectWithProducts._count.products} product(s) are using this effect.`,
        });
      }

      await prisma.effect.delete({ where: { id } });
      return res.status(204).send();
    } catch (error) {
      console.error("Error deleting effect:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

export { metadataRouter };
