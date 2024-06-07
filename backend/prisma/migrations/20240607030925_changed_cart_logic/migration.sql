/*
  Warnings:

  - You are about to drop the column `city` on the `UserProfile` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `UserProfile` table. All the data in the column will be lost.
  - You are about to drop the column `streetName` on the `UserProfile` table. All the data in the column will be lost.
  - You are about to drop the column `streetNumber` on the `UserProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "cartId" TEXT;

-- AlterTable
ALTER TABLE "UserProfile" DROP COLUMN "city",
DROP COLUMN "state",
DROP COLUMN "streetName",
DROP COLUMN "streetNumber",
ADD COLUMN     "billingAddressId" TEXT,
ADD COLUMN     "canContact" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phoneNumber" TEXT,
ADD COLUMN     "shippingAddressId" TEXT;

-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "street1" TEXT NOT NULL,
    "street2" TEXT,
    "city" TEXT NOT NULL,
    "state" "State" NOT NULL,
    "postalCode" TEXT NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cart" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cart_userId_key" ON "Cart"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Cart_id_userId_key" ON "Cart"("id", "userId");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_billingAddressId_fkey" FOREIGN KEY ("billingAddressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_shippingAddressId_fkey" FOREIGN KEY ("shippingAddressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
