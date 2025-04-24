// src/routes/metadata.router.ts

import { Router } from "express";
import { prisma } from "../../prisma/db.setup";
import { authenticationAdminMiddleware } from "../utils/auth-utils";

const metadataRouter = Router();

// Get all metadata (public)
metadataRouter.get("/", async function (req, res) {
  try {
    // Fetch all metadata in parallel
    const [brands, categories, colors, effects] = await Promise.all([
      prisma.brand.findMany({
        orderBy: { name: "asc" },
      }),
      prisma.category.findMany({
        orderBy: { name: "asc" },
      }),
      prisma.color.findMany({
        orderBy: { name: "asc" },
      }),
      prisma.effect.findMany({
        orderBy: { name: "asc" },
      }),
    ]);

    return res.status(200).json({
      brands,
      categories,
      colors,
      effects,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error fetching metadata" });
  }
});

// Admin-only endpoints for managing metadata

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

      // Check if brand already exists
      const existingBrand = await prisma.brand.findFirst({
        where: { name: name.trim() },
      });

      if (existingBrand) {
        return res.status(409).json({ message: "Brand already exists" });
      }

      const brand = await prisma.brand.create({
        data: { name: name.trim() },
      });

      return res.status(201).json(brand);
    } catch (error) {
      console.error("Error creating brand:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

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

      // Check if category already exists
      const existingCategory = await prisma.category.findFirst({
        where: { name: name.trim() },
      });

      if (existingCategory) {
        return res.status(409).json({ message: "Category already exists" });
      }

      const category = await prisma.category.create({
        data: { name: name.trim() },
      });

      return res.status(201).json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

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

      // Check if color already exists
      const existingColor = await prisma.color.findFirst({
        where: { name: name.trim() },
      });

      if (existingColor) {
        return res.status(409).json({ message: "Color already exists" });
      }

      const color = await prisma.color.create({
        data: { name: name.trim() },
      });

      return res.status(201).json(color);
    } catch (error) {
      console.error("Error creating color:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

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

      // Check if effect already exists
      const existingEffect = await prisma.effect.findFirst({
        where: { name: name.trim() },
      });

      if (existingEffect) {
        return res.status(409).json({ message: "Effect already exists" });
      }

      const effect = await prisma.effect.create({
        data: { name: name.trim() },
      });

      return res.status(201).json(effect);
    } catch (error) {
      console.error("Error creating effect:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

export { metadataRouter };
