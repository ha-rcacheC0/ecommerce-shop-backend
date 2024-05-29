-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Brand" ADD VALUE 'SKY_EAGLE';
ALTER TYPE "Brand" ADD VALUE 'ALPHA_FIREWORKS';
ALTER TYPE "Brand" ADD VALUE 'MIGHTY_MAX';
ALTER TYPE "Brand" ADD VALUE 'MAD_OX';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Colors" ADD VALUE 'SILVER';
ALTER TYPE "Colors" ADD VALUE 'BLACK';
ALTER TYPE "Colors" ADD VALUE 'BROWN';
ALTER TYPE "Colors" ADD VALUE 'GOLD';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Effects" ADD VALUE 'BROCADE';
ALTER TYPE "Effects" ADD VALUE 'CHRYSANTHEMUM';
ALTER TYPE "Effects" ADD VALUE 'COMET';
ALTER TYPE "Effects" ADD VALUE 'CROSSETTE';
ALTER TYPE "Effects" ADD VALUE 'PEARLS';
ALTER TYPE "Effects" ADD VALUE 'WATERFALL';
ALTER TYPE "Effects" ADD VALUE 'FLYING_FISH';
ALTER TYPE "Effects" ADD VALUE 'PALM_TREE';
ALTER TYPE "Effects" ADD VALUE 'PEONY';
ALTER TYPE "Effects" ADD VALUE 'PISTIL';
ALTER TYPE "Effects" ADD VALUE 'RISING_TAIL';
ALTER TYPE "Effects" ADD VALUE 'TOURBILLION';
ALTER TYPE "Effects" ADD VALUE 'GLOW';
ALTER TYPE "Effects" ADD VALUE 'NISHIKI_KAMURO';
ALTER TYPE "Effects" ADD VALUE 'GLITTER';

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "isCaseBreakable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "unitPrice" DECIMAL(65,30);
