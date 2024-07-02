/*
  Warnings:

  - You are about to drop the column `isUnit` on the `CartProduct` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `CartProduct` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CartProduct" DROP COLUMN "isUnit",
DROP COLUMN "quantity",
ADD COLUMN     "caseQuantity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "unitQuantity" INTEGER NOT NULL DEFAULT 0;
