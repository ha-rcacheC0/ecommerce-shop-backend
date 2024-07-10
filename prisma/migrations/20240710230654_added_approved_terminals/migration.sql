-- CreateTable
CREATE TABLE "ApprovedTerminals" (
    "id" TEXT NOT NULL,
    "acceptOutOfStateLicence" BOOLEAN NOT NULL,
    "terminalName" TEXT NOT NULL,
    "businessRequired" BOOLEAN NOT NULL,
    "addressId" TEXT NOT NULL,

    CONSTRAINT "ApprovedTerminals_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ApprovedTerminals" ADD CONSTRAINT "ApprovedTerminals_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
