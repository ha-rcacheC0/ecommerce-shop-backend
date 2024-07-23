/*
  Warnings:

  - Added the required column `company` to the `ApprovedTerminals` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TerminalCompany" AS ENUM ('FEDEX', 'DHL');

-- AlterTable
ALTER TABLE "ApprovedTerminals" ADD COLUMN     "company" "TerminalCompany" NOT NULL;
