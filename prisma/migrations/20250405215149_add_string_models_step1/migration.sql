/*
  Warnings:

  - The values [PARACHUTE] on the enum `Category` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Category_new" AS ENUM ('REPEATERS_200_GRAM', 'REPEATERS_500_GRAM', 'ASSORTMENT', 'BOTTLE_ROCKETS', 'CONE_FLORAL', 'CONFETTI_SHOOTERS_AIR_COMPRESSED', 'FIRECRACKERS', 'FLYING_HELICOPTERS', 'FOUNTAINS', 'FUSE', 'GENDER_REVEAL', 'GROUND', 'PARACHUTES', 'PINWHEELS', 'RELOADABLES', 'ROCKETS_MISSLES', 'ROMAN_CANDLES', 'SHELLS_MINES', 'SNAKE_SMOKE', 'SPARKLERS', 'SUPPLIES_VISIBILITY', 'TOY_NOVELTIES_STROBES', 'TUBES');
ALTER TABLE "Categories" ALTER COLUMN "name" TYPE "Category_new" USING ("name"::text::"Category_new");
ALTER TYPE "Category" RENAME TO "Category_old";
ALTER TYPE "Category_new" RENAME TO "Category";
DROP TYPE "Category_old";
COMMIT;

-- AlterEnum
ALTER TYPE "Effects" ADD VALUE 'WILLOW';

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "brandId" TEXT,
ADD COLUMN     "categoryId" TEXT;

-- AlterTable
ALTER TABLE "_ColorStringsToProduct" ADD CONSTRAINT "_ColorStringsToProduct_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_ColorStringsToProduct_AB_unique";

-- AlterTable
ALTER TABLE "_EffectStringsToProduct" ADD CONSTRAINT "_EffectStringsToProduct_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_EffectStringsToProduct_AB_unique";

-- CreateTable
CREATE TABLE "BrandNew" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "BrandNew_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoryNew" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "CategoryNew_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ColorNew" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "ColorNew_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EffectNew" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "EffectNew_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ProductColorNew" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProductColorNew_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ProductEffectNew" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProductEffectNew_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "BrandNew_name_key" ON "BrandNew"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryNew_name_key" ON "CategoryNew"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ColorNew_name_key" ON "ColorNew"("name");

-- CreateIndex
CREATE UNIQUE INDEX "EffectNew_name_key" ON "EffectNew"("name");

-- CreateIndex
CREATE INDEX "_ProductColorNew_B_index" ON "_ProductColorNew"("B");

-- CreateIndex
CREATE INDEX "_ProductEffectNew_B_index" ON "_ProductEffectNew"("B");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "BrandNew"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "CategoryNew"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductColorNew" ADD CONSTRAINT "_ProductColorNew_A_fkey" FOREIGN KEY ("A") REFERENCES "ColorNew"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductColorNew" ADD CONSTRAINT "_ProductColorNew_B_fkey" FOREIGN KEY ("B") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductEffectNew" ADD CONSTRAINT "_ProductEffectNew_A_fkey" FOREIGN KEY ("A") REFERENCES "EffectNew"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductEffectNew" ADD CONSTRAINT "_ProductEffectNew_B_fkey" FOREIGN KEY ("B") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
