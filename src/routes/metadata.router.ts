// In a new file like metadata.router.ts
import { Router } from "express";
import { prisma } from "../../prisma/db.setup";

const metadataRouter = Router();

metadataRouter.get("/", async function (req, res) {
  try {
    // Fetch all metadata in parallel
    const [brands, categories, colors, effects] = await Promise.all([
      prisma.brand.findMany(),
      prisma.category.findMany(),
      prisma.color.findMany(),
      prisma.effect.findMany(),
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

export { metadataRouter };
