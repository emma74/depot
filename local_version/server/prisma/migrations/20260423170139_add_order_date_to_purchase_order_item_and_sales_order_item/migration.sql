/*
  Warnings:

  - Added the required column `orderDate` to the `PurchaseOrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `saleOrderDate` to the `SalesOrderItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PurchaseOrderItem" ADD COLUMN     "orderDate" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "SalesOrderItem" ADD COLUMN     "saleOrderDate" TIMESTAMP(3) NOT NULL;
