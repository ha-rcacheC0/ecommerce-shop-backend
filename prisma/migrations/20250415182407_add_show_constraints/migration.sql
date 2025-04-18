/*
  Warnings:

  - You are about to drop the `Show` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Show" DROP CONSTRAINT "Show_showTypeId_fkey";

-- DropForeignKey
ALTER TABLE "ShowProduct" DROP CONSTRAINT "ShowProduct_showId_fkey";

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "showTypeId" TEXT;

-- DropTable
DROP TABLE "Show";

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_showTypeId_fkey" FOREIGN KEY ("showTypeId") REFERENCES "ShowType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShowProduct" ADD CONSTRAINT "ShowProduct_showId_fkey" FOREIGN KEY ("showId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;