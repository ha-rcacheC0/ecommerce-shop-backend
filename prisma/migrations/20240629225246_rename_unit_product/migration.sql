/*
  Warnings:

  - You are about to drop the column `unitProductId` on the `Product` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[UnitProductId]` on the table `Product` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Product_unitProductId_key";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "unitProductId",
ADD COLUMN     "UnitProductId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Product_UnitProductId_key" ON "Product"("UnitProductId");
