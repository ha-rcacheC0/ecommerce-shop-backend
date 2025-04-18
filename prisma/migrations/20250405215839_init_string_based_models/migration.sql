/*
  Warnings:

  - You are about to drop the column `UnitProductId` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `brandsId` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `categoriesId` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the `BrandNew` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Brands` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Categories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CategoryNew` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ColorNew` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ColorStrings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EffectNew` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EffectStrings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ColorStringsToProduct` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_EffectStringsToProduct` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ProductColorNew` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ProductEffectNew` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `brandId` on table `Product` required. This step will fail if there are existing NULL values in that column.
  - Made the column `categoryId` on table `Product` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_brandId_fkey";

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_brandsId_fkey";

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_categoriesId_fkey";

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "_ColorStringsToProduct" DROP CONSTRAINT "_ColorStringsToProduct_A_fkey";

-- DropForeignKey
ALTER TABLE "_ColorStringsToProduct" DROP CONSTRAINT "_ColorStringsToProduct_B_fkey";

-- DropForeignKey
ALTER TABLE "_EffectStringsToProduct" DROP CONSTRAINT "_EffectStringsToProduct_A_fkey";

-- DropForeignKey
ALTER TABLE "_EffectStringsToProduct" DROP CONSTRAINT "_EffectStringsToProduct_B_fkey";

-- DropForeignKey
ALTER TABLE "_ProductColorNew" DROP CONSTRAINT "_ProductColorNew_A_fkey";

-- DropForeignKey
ALTER TABLE "_ProductColorNew" DROP CONSTRAINT "_ProductColorNew_B_fkey";

-- DropForeignKey
ALTER TABLE "_ProductEffectNew" DROP CONSTRAINT "_ProductEffectNew_A_fkey";

-- DropForeignKey
ALTER TABLE "_ProductEffectNew" DROP CONSTRAINT "_ProductEffectNew_B_fkey";

-- DropIndex
DROP INDEX "Product_UnitProductId_key";

-- DropIndex
DROP INDEX "Product_id_categoriesId_key";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "UnitProductId",
DROP COLUMN "brandsId",
DROP COLUMN "categoriesId",
ALTER COLUMN "brandId" SET NOT NULL,
ALTER COLUMN "categoryId" SET NOT NULL;

-- DropTable
DROP TABLE "BrandNew";

-- DropTable
DROP TABLE "Brands";

-- DropTable
DROP TABLE "Categories";

-- DropTable
DROP TABLE "CategoryNew";

-- DropTable
DROP TABLE "ColorNew";

-- DropTable
DROP TABLE "ColorStrings";

-- DropTable
DROP TABLE "EffectNew";

-- DropTable
DROP TABLE "EffectStrings";

-- DropTable
DROP TABLE "_ColorStringsToProduct";

-- DropTable
DROP TABLE "_EffectStringsToProduct";

-- DropTable
DROP TABLE "_ProductColorNew";

-- DropTable
DROP TABLE "_ProductEffectNew";

-- DropEnum
DROP TYPE "Brand";

-- DropEnum
DROP TYPE "Category";

-- DropEnum
DROP TYPE "Colors";

-- DropEnum
DROP TYPE "Effects";

-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Color" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Color_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Effect" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Effect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ProductColors" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProductColors_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ProductEffects" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProductEffects_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Brand_name_key" ON "Brand"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Color_name_key" ON "Color"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Effect_name_key" ON "Effect"("name");

-- CreateIndex
CREATE INDEX "_ProductColors_B_index" ON "_ProductColors"("B");

-- CreateIndex
CREATE INDEX "_ProductEffects_B_index" ON "_ProductEffects"("B");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductColors" ADD CONSTRAINT "_ProductColors_A_fkey" FOREIGN KEY ("A") REFERENCES "Color"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductColors" ADD CONSTRAINT "_ProductColors_B_fkey" FOREIGN KEY ("B") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductEffects" ADD CONSTRAINT "_ProductEffects_A_fkey" FOREIGN KEY ("A") REFERENCES "Effect"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductEffects" ADD CONSTRAINT "_ProductEffects_B_fkey" FOREIGN KEY ("B") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
