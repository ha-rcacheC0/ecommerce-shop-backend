-- CreateEnum
CREATE TYPE "Effects" AS ENUM ('STROBES', 'CRACKLES', 'SIZZLES', 'SNAPS', 'LOUD_BANG', 'WHISTLE', 'FAN_EFFECTS', 'WILLOWS', 'SMOKE');

-- CreateEnum
CREATE TYPE "Colors" AS ENUM ('GREEN', 'RED', 'BLUE', 'ORANGE', 'YELLOW', 'PURPLE', 'PINK', 'WHITE');

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('ASSORTMENT', 'FIRECRACKERS', 'SNAKE_SMOKE', 'TOY_NOVELTIES_STROBES', 'CONE_FLORAL', 'GROUND', 'FLYING_HELICOPTERS', 'REPEATERS_200_GRAM', 'REPEATERS_500_GRAM', 'TUBES', 'RELOADABLES', 'PARACHUTES', 'BOTTLE_ROCKETS', 'ROCKETS_MISSLES', 'SPARKLERS', 'PINWHEELS', 'ROMAN_CANDLES', 'FOUNTAINS', 'GENDER_REVEAL', 'SHELLS_MINES', 'FUSE', 'SUPPLIES_VISIBILITY', 'CONFETTI_SHOOTERS_AIR_COMPRESSED');

-- CreateEnum
CREATE TYPE "Brand" AS ENUM ('BOOM_WOW', 'SKY_SLAM', 'STARGET', 'SKY_PIONEER', 'T_SKY', 'MC_FIREWORKS', 'RED_LANTERN', 'MIRACLE', 'LEGEND', 'TOPGUN', 'WINDA', 'SIN_CITY', 'HAPPY_FAMILY', 'HOP_KEE', 'PYRO_DIABLO', 'GENERIC', 'RACCOON', 'PYRO_MOOI', 'KRIPTON_FIREWORKS', 'BUM_BUM', 'SHOGUN', 'WISE_GUY', 'BLACK_SCORPION', 'CRZ', 'CSS', 'BROTHERS', 'DOMINATOR', 'MUSCLE_PACK', 'SKIES_THE_LIMIT');

-- CreateTable
CREATE TABLE "Product" (
    "id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT NOT NULL DEFAULT 'placeholder',
    "casePrice" DECIMAL(65,30) NOT NULL,
    "inStock" BOOLEAN NOT NULL,
    "package" INTEGER[],
    "categoriesId" TEXT NOT NULL,
    "brandsId" TEXT NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EffectStrings" (
    "id" TEXT NOT NULL,
    "name" "Effects" NOT NULL,

    CONSTRAINT "EffectStrings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ColorStrings" (
    "id" TEXT NOT NULL,
    "name" "Colors" NOT NULL,

    CONSTRAINT "ColorStrings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Categories" (
    "id" TEXT NOT NULL,
    "name" "Category" NOT NULL,

    CONSTRAINT "Categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Brands" (
    "id" TEXT NOT NULL,
    "name" "Brand" NOT NULL,

    CONSTRAINT "Brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_EffectStringsToProduct" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_ColorStringsToProduct" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_id_categoriesId_key" ON "Product"("id", "categoriesId");

-- CreateIndex
CREATE UNIQUE INDEX "_EffectStringsToProduct_AB_unique" ON "_EffectStringsToProduct"("A", "B");

-- CreateIndex
CREATE INDEX "_EffectStringsToProduct_B_index" ON "_EffectStringsToProduct"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ColorStringsToProduct_AB_unique" ON "_ColorStringsToProduct"("A", "B");

-- CreateIndex
CREATE INDEX "_ColorStringsToProduct_B_index" ON "_ColorStringsToProduct"("B");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoriesId_fkey" FOREIGN KEY ("categoriesId") REFERENCES "Categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_brandsId_fkey" FOREIGN KEY ("brandsId") REFERENCES "Brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EffectStringsToProduct" ADD CONSTRAINT "_EffectStringsToProduct_A_fkey" FOREIGN KEY ("A") REFERENCES "EffectStrings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EffectStringsToProduct" ADD CONSTRAINT "_EffectStringsToProduct_B_fkey" FOREIGN KEY ("B") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ColorStringsToProduct" ADD CONSTRAINT "_ColorStringsToProduct_A_fkey" FOREIGN KEY ("A") REFERENCES "ColorStrings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ColorStringsToProduct" ADD CONSTRAINT "_ColorStringsToProduct_B_fkey" FOREIGN KEY ("B") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
