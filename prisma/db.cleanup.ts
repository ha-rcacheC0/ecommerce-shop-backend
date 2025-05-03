import { prisma } from "./db.setup";

export const clearDB = async () => {
  console.log("Dropping DB for clean migrations");

  // Delete many for each table, in order making sure cascading deletes apply properly
  await prisma.effect.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.brand.deleteMany();
  console.log("DB is clean , ready for new migrations");
};
