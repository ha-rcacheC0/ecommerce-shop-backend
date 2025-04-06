/*
  Warnings:

  - The values [SKIES_THE_LIMIT] on the enum `Brand` will be removed. If these variants are still used in the database, this will fail.
  - The values [PARACHUTES] on the enum `Category` will be removed. If these variants are still used in the database, this will fail.
  - The values [WILLOWS] on the enum `Effects` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Brand_new" AS ENUM ('ALPHA_FIREWORKS', 'BLACK_SCORPION', 'BLUE_DRAGON', 'BOOM_WOW', 'BOOMER', 'BROTHERS', 'BUM_BUM', 'CRZ', 'CSS', 'DEMON_PYRO', 'DFS', 'DOMINATOR', 'DUCK', 'FIREHAWK', 'FISHERMAN', 'FOX_FIREWORKS', 'GALAXY_FIREWORKS', 'GENERIC', 'HAPPY_FAMILY', 'HOP_KEE', 'IRONMAN', 'KRIPTON_FIREWORKS', 'LEGEND', 'MAD_OX', 'MC_FIREWORKS', 'MIGHTY_MAX', 'MIRACLE', 'MUSCLE_PACK', 'PYRO_DIABLO', 'PYRO_MOOI', 'PYRO_PIRATE', 'RACCOON', 'RED_LANTERN', 'SHOGUN', 'SIN_CITY', 'SKY_SLAM', 'SKY_PAINTER', 'SKY_PIONEER', 'SKY_EAGLE', 'STARGET', 'SUNS_FIREWORKS', 'T_SKY', 'TOPGUN', 'WINDA', 'WISE_GUY');
ALTER TABLE "Brands" ALTER COLUMN "name" TYPE "Brand_new" USING ("name"::text::"Brand_new");
ALTER TYPE "Brand" RENAME TO "Brand_old";
ALTER TYPE "Brand_new" RENAME TO "Brand";
DROP TYPE "Brand_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "Category_new" AS ENUM ('REPEATERS_200_GRAM', 'REPEATERS_500_GRAM', 'RELOADABLES', 'ASSORTMENT', 'BOTTLE_ROCKETS', 'CONE_FLORAL', 'CONFETTI_SHOOTERS_AIR_COMPRESSED', 'FIRECRACKERS', 'FLYING_HELICOPTERS', 'FOUNTAINS', 'FUSE', 'GENDER_REVEAL', 'GROUND', 'PARACHUTE', 'PINWHEELS', 'SHELLS_MINES', 'SNAKE_SMOKE', 'TOY_NOVELTIES_STROBES', 'TUBES', 'ROCKETS_MISSLES', 'SPARKLERS', 'ROMAN_CANDLES', 'SUPPLIES_VISIBILITY');
ALTER TABLE "Categories" ALTER COLUMN "name" TYPE "Category_new" USING ("name"::text::"Category_new");
ALTER TYPE "Category" RENAME TO "Category_old";
ALTER TYPE "Category_new" RENAME TO "Category";
DROP TYPE "Category_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "Effects_new" AS ENUM ('BROCADE', 'CHRYSANTHEMUM', 'COMET', 'CONFETTI', 'CRACKLES', 'CROSSETTE', 'FAN_EFFECTS', 'FLYING_FISH', 'GLITTER', 'GLOW', 'HELICOPTER', 'LOUD_BANG', 'NISHIKI_KAMURO', 'PALM_TREE', 'PARACHUTE', 'PEARLS', 'PEONY', 'PISTIL', 'REVEAL', 'RISING_TAIL', 'SIZZLES', 'SMOKE', 'SNAKE', 'SNAPS', 'SPARKLES', 'SPINS', 'STROBES', 'TOURBILLION', 'WATERFALL', 'WHISTLE');
ALTER TABLE "EffectStrings" ALTER COLUMN "name" TYPE "Effects_new" USING ("name"::text::"Effects_new");
ALTER TYPE "Effects" RENAME TO "Effects_old";
ALTER TYPE "Effects_new" RENAME TO "Effects";
DROP TYPE "Effects_old";
COMMIT;
