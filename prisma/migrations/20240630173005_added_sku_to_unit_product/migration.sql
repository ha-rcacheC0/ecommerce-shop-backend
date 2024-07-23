/*
  Warnings:

  - A unique constraint covering the columns `[sku]` on the table `UnitProduct` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `sku` to the `UnitProduct` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UnitProduct" ADD COLUMN     "sku" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "UnitProduct_sku_key" ON "UnitProduct"("sku");
