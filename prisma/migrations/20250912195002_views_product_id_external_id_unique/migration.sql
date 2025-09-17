/*
  Warnings:

  - A unique constraint covering the columns `[productId,externalId]` on the table `views` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."views_productId_position_idx";

-- CreateIndex
CREATE UNIQUE INDEX "views_productId_externalId_key" ON "public"."views"("productId", "externalId");
