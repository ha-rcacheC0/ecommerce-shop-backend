-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Brand" ADD VALUE 'PYRO_PIRATE';
ALTER TYPE "Brand" ADD VALUE 'IRONMAN';
ALTER TYPE "Brand" ADD VALUE 'BEIHAI_POPPOP';
ALTER TYPE "Brand" ADD VALUE 'BOOMER';
ALTER TYPE "Brand" ADD VALUE 'FIREHAWK';
ALTER TYPE "Brand" ADD VALUE 'SKY_PAINTER';
ALTER TYPE "Brand" ADD VALUE 'GALAXY_FIREWORKS';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Effects" ADD VALUE 'SNAKE';
ALTER TYPE "Effects" ADD VALUE 'CONFETTI';
