-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "apparelTypeId" TEXT,
ADD COLUMN     "isApparel" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ApparelType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "ApparelType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApparelProduct" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "colorId" TEXT,
    "unitPrice" DECIMAL(65,30) NOT NULL,
    "availableStock" INTEGER NOT NULL,

    CONSTRAINT "ApparelProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApparelType_name_key" ON "ApparelType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ApparelProduct_productId_key" ON "ApparelProduct"("productId");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_apparelTypeId_fkey" FOREIGN KEY ("apparelTypeId") REFERENCES "ApparelType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApparelProduct" ADD CONSTRAINT "ApparelProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApparelProduct" ADD CONSTRAINT "ApparelProduct_colorId_fkey" FOREIGN KEY ("colorId") REFERENCES "Color"("id") ON DELETE SET NULL ON UPDATE CASCADE;
