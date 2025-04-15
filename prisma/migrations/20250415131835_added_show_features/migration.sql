-- CreateTable
CREATE TABLE "Show" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(65,30) NOT NULL,
    "image" TEXT NOT NULL DEFAULT 'placeholder',
    "videoURL" TEXT,
    "inStock" BOOLEAN NOT NULL DEFAULT true,
    "showTypeId" TEXT NOT NULL,

    CONSTRAINT "Show_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShowProduct" (
    "id" TEXT NOT NULL,
    "showId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "notes" TEXT,

    CONSTRAINT "ShowProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShowType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "ShowType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShowProduct_showId_productId_key" ON "ShowProduct"("showId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "ShowType_name_key" ON "ShowType"("name");

-- AddForeignKey
ALTER TABLE "Show" ADD CONSTRAINT "Show_showTypeId_fkey" FOREIGN KEY ("showTypeId") REFERENCES "ShowType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShowProduct" ADD CONSTRAINT "ShowProduct_showId_fkey" FOREIGN KEY ("showId") REFERENCES "Show"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShowProduct" ADD CONSTRAINT "ShowProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
