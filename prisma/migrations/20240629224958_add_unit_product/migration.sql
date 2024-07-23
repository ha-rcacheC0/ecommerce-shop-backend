/*
  Warnings:

  - The values [Alabama,Alaska,Arizona,Arkansas,California,Colorado,Connecticut,Delaware,Florida,Georgia,Hawaii,Idaho,Illinois,Indiana,Iowa,Kansas,Kentucky,Louisiana,Maine,Maryland,Massachusetts,Michigan,Minnesota,Mississippi,Missouri,Montana,Nebraska,Nevada,New_Hampshire,New_Jersey,New_Mexico,New_York,North_Carolina,North_Dakota,Ohio,Oklahoma,Oregon,Pennsylvania,Rhode_Island,South_Carolina,South_Dakota,Tennessee,Texas,Utah,Vermont,Virginia,Washington,West_Virginia,Wisconsin,Wyoming] on the enum `State` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `unitPrice` on the `Product` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[unitProductId]` on the table `Product` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "State_new" AS ENUM ('AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY');
ALTER TABLE "Address" ALTER COLUMN "state" TYPE "State_new" USING ("state"::text::"State_new");
ALTER TYPE "State" RENAME TO "State_old";
ALTER TYPE "State_new" RENAME TO "State";
DROP TYPE "State_old";
COMMIT;

-- AlterTable
ALTER TABLE "CartProduct" ADD COLUMN     "isUnit" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
CREATE SEQUENCE product_id_seq;
ALTER TABLE "Product" DROP COLUMN "unitPrice",
ADD COLUMN     "unitProductId" INTEGER,
ALTER COLUMN "id" SET DEFAULT nextval('product_id_seq');
ALTER SEQUENCE product_id_seq OWNED BY "Product"."id";

-- CreateTable
CREATE TABLE "UnitProduct" (
    "id" TEXT NOT NULL,
    "productId" INTEGER NOT NULL,
    "unitPrice" DECIMAL(65,30) NOT NULL,
    "package" INTEGER[],
    "availableStock" INTEGER NOT NULL,

    CONSTRAINT "UnitProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UnitProduct_productId_key" ON "UnitProduct"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_unitProductId_key" ON "Product"("unitProductId");

-- AddForeignKey
ALTER TABLE "UnitProduct" ADD CONSTRAINT "UnitProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
