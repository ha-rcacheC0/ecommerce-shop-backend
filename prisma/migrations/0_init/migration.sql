-- CreateEnum
CREATE TYPE "Effects" AS ENUM ('STROBES', 'CRACKLES', 'SIZZLES', 'SNAPS', 'LOUD_BANG', 'WHISTLE', 'FAN_EFFECTS', 'WILLOWS', 'SMOKE');

-- CreateEnum
CREATE TYPE "Colors" AS ENUM ('GREEN', 'RED', 'BLUE', 'ORANGE', 'YELLOW', 'PURPLE', 'PINK', 'WHITE');

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('ASSORTMENT', 'FIRECRACKERS', 'SNAKE_SMOKE', 'TOY_NOVELTIES_STROBES', 'CONE_FLORAL', 'GROUND', 'FLYING_HELICOPTERS', 'REPEATERS_200_GRAM', 'REPEATERS_500_GRAM', 'TUBES', 'RELOADABLES', 'PARACHUTES', 'BOTTLE_ROCKETS', 'ROCKETS_MISSLES', 'SPARKLERS', 'PINWHEELS', 'ROMAN_CANDLES', 'FOUNTAINS', 'GENDER_REVEAL', 'SHELLS_MINES', 'FUSE', 'SUPPLIES_VISIBILITY', 'CONFETTI_SHOOTERS_AIR_COMPRESSED');

-- CreateEnum
CREATE TYPE "Brand" AS ENUM ('BOOM_WOW', 'SKY_SLAM', 'STARGET', 'SKY_PIONEER', 'T_SKY', 'MC_FIREWORKS', 'RED_LANTERN', 'MIRACLE', 'LEGEND', 'TOPGUN', 'WINDA', 'SIN_CITY', 'HAPPY_FAMILY', 'HOP_KEE', 'PYRO_DIABLO', 'GENERIC', 'RACCOON', 'PYRO_MOOI', 'KRIPTON_FIREWORKS', 'BUM_BUM', 'SHOGUN', 'WISE_GUY', 'BLACK_SCORPION', 'CRZ', 'CSS', 'BROTHERS', 'DOMINATOR', 'MUSCLE_PACK', 'SKIES_THE_LIMIT', 'DUCK');

-- CreateEnum
CREATE TYPE "State" AS ENUM ('Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New_Hampshire', 'New_Jersey', 'New_Mexico', 'New_York', 'North_Carolina', 'North_Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode_Island', 'South_Carolina', 'South_Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West_Virginia', 'Wisconsin', 'Wyoming');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'MANAGER', 'ADMIN');

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
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "email" TEXT NOT NULL,
    "hashedPassword" TEXT NOT NULL,
    "createdOn" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "lastLogin" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "streetNumber" TEXT,
    "streetName" TEXT,
    "city" TEXT,
    "state" "State",
    "userId" TEXT NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
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
CREATE UNIQUE INDEX "EffectStrings_name_key" ON "EffectStrings"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ColorStrings_name_key" ON "ColorStrings"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Categories_name_key" ON "Categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Brands_name_key" ON "Brands"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "_EffectStringsToProduct_AB_unique" ON "_EffectStringsToProduct"("A", "B");

-- CreateIndex
CREATE INDEX "_EffectStringsToProduct_B_index" ON "_EffectStringsToProduct"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ColorStringsToProduct_AB_unique" ON "_ColorStringsToProduct"("A", "B");

-- CreateIndex
CREATE INDEX "_ColorStringsToProduct_B_index" ON "_ColorStringsToProduct"("B");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_brandsId_fkey" FOREIGN KEY ("brandsId") REFERENCES "Brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoriesId_fkey" FOREIGN KEY ("categoriesId") REFERENCES "Categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EffectStringsToProduct" ADD CONSTRAINT "_EffectStringsToProduct_A_fkey" FOREIGN KEY ("A") REFERENCES "EffectStrings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EffectStringsToProduct" ADD CONSTRAINT "_EffectStringsToProduct_B_fkey" FOREIGN KEY ("B") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ColorStringsToProduct" ADD CONSTRAINT "_ColorStringsToProduct_A_fkey" FOREIGN KEY ("A") REFERENCES "ColorStrings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ColorStringsToProduct" ADD CONSTRAINT "_ColorStringsToProduct_B_fkey" FOREIGN KEY ("B") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

