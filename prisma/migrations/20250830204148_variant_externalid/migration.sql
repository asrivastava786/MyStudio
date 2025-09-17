/*
  Warnings:

  - A unique constraint covering the columns `[productId,externalId]` on the table `variants` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."variants" ADD COLUMN     "externalId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "variants_productId_externalId_key" ON "public"."variants"("productId", "externalId");
