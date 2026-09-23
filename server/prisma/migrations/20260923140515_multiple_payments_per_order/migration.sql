/*
  Warnings:

  - You are about to drop the column `totalAmountBal` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `totalEmptiesBal` on the `Payment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "totalAmountBal",
DROP COLUMN "totalEmptiesBal";
