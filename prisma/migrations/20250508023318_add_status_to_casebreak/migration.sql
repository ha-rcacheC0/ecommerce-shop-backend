/*
  Warnings:

  - The values [SALES] on the enum `ReportType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ReportType_new" AS ENUM ('PURCHASE', 'INVENTORY', 'USER_ACTIVITY', 'FINANCIAL', 'PRODUCT_PERFORMANCE', 'CASE_BREAK');
ALTER TABLE "Report" ALTER COLUMN "type" TYPE "ReportType_new" USING ("type"::text::"ReportType_new");
ALTER TYPE "ReportType" RENAME TO "ReportType_old";
ALTER TYPE "ReportType_new" RENAME TO "ReportType";
DROP TYPE "ReportType_old";
COMMIT;

-- AlterTable
ALTER TABLE "BreakCaseRequest" ADD COLUMN     "status" "ReportStatus" NOT NULL DEFAULT 'PENDING';
