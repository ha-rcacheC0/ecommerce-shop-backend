/*
  Warnings:

  - A unique constraint covering the columns `[showId,productId,isUnit]` on the table `ShowProduct` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "ShowProduct_showId_productId_key";

-- AlterTable
ALTER TABLE "ShowProduct" ADD COLUMN     "isUnit" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "ShowProduct_showId_productId_isUnit_key" ON "ShowProduct"("showId", "productId", "isUnit");
