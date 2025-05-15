/*
  Warnings:

  - You are about to drop the column `amount` on the `PurchaseRecord` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PurchaseItem" ADD COLUMN     "itemSubTotal" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "PurchaseRecord" DROP COLUMN "amount",
ADD COLUMN     "discountAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "discountCode" TEXT,
ADD COLUMN     "discountType" TEXT,
ADD COLUMN     "grandTotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "liftGateFee" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "shippingCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "subTotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "tax" DECIMAL(65,30) NOT NULL DEFAULT 0;
