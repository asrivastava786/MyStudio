/*
  Warnings:

  - A unique constraint covering the columns `[productId,name]` on the table `product_options` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[productId,sku]` on the table `variants` will be added. If there are existing duplicate values, this will fail.
  - Made the column `externalId` on table `variants` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `externalId` to the `views` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."image_variants_variantId_idx";

-- DropIndex
DROP INDEX "public"."print_area_variants_variantId_idx";

-- DropIndex
DROP INDEX "public"."variant_option_values_optionValueId_idx";

-- DropIndex
DROP INDEX "public"."variants_sku_key";

-- AlterTable
ALTER TABLE "public"."products" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
CREATE SEQUENCE "public".variants_id_seq;
ALTER TABLE "public"."variants" ALTER COLUMN "id" SET DEFAULT nextval('"public".variants_id_seq'),
ALTER COLUMN "externalId" SET NOT NULL;
ALTER SEQUENCE "public".variants_id_seq OWNED BY "public"."variants"."id";

-- AlterTable
CREATE SEQUENCE "public".views_id_seq;
ALTER TABLE "public"."views" ADD COLUMN     "externalId" INTEGER NOT NULL,
ALTER COLUMN "id" SET DEFAULT nextval('"public".views_id_seq');
ALTER SEQUENCE "public".views_id_seq OWNED BY "public"."views"."id";

-- CreateIndex
CREATE UNIQUE INDEX "product_options_productId_name_key" ON "public"."product_options"("productId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "variants_productId_sku_key" ON "public"."variants"("productId", "sku");
