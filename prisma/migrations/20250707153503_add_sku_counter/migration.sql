-- CreateTable
CREATE TABLE "sku_counters" (
    "id" TEXT NOT NULL,
    "counter" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "sku_counters_pkey" PRIMARY KEY ("id")
);
