/*
  Warnings:

  - A unique constraint covering the columns `[cartId,productId,variantId]` on the table `CartProduct` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'UNISEX');

-- DropIndex
DROP INDEX "CartProduct_cartId_productId_key";

-- AlterTable
ALTER TABLE "ApparelProduct" ADD COLUMN     "migrated" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "CartProduct" ADD COLUMN     "variantId" TEXT;

-- AlterTable
ALTER TABLE "PurchaseItem" ADD COLUMN     "variantId" TEXT;

-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "colorId" TEXT,
    "unitPrice" DECIMAL(65,30) NOT NULL,
    "availableStock" INTEGER NOT NULL DEFAULT 999,
    "additionalSku" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_sku_key" ON "ProductVariant"("sku");

-- CreateIndex
CREATE INDEX "ProductVariant_productId_idx" ON "ProductVariant"("productId");

-- CreateIndex
CREATE INDEX "ProductVariant_sku_idx" ON "ProductVariant"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_productId_size_gender_colorId_key" ON "ProductVariant"("productId", "size", "gender", "colorId");

-- CreateIndex
CREATE UNIQUE INDEX "CartProduct_cartId_productId_variantId_key" ON "CartProduct"("cartId", "productId", "variantId");

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_colorId_fkey" FOREIGN KEY ("colorId") REFERENCES "Color"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartProduct" ADD CONSTRAINT "CartProduct_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseItem" ADD CONSTRAINT "PurchaseItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
