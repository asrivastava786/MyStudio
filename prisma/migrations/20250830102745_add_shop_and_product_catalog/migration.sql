-- CreateEnum
CREATE TYPE "public"."Position" AS ENUM ('front', 'back');

-- CreateEnum
CREATE TYPE "public"."OptionType" AS ENUM ('size', 'color', 'custom');

-- CreateTable
CREATE TABLE "public"."products" (
    "id" VARCHAR(40) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "blueprintId" INTEGER NOT NULL,
    "printProviderId" INTEGER NOT NULL,
    "printifyUserId" INTEGER NOT NULL,
    "printifyShopId" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "originalProductId" VARCHAR(64),
    "isPrintifyExpressEligible" BOOLEAN NOT NULL DEFAULT false,
    "isPrintifyExpressEnabled" BOOLEAN NOT NULL DEFAULT false,
    "isEconomyShippingEligible" BOOLEAN NOT NULL DEFAULT false,
    "isEconomyShippingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "creatorName" VARCHAR(120),
    "creatorEmail" VARCHAR(256),
    "printDetails" JSONB,
    "salesChannelProperties" JSONB,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tags" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(64) NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."product_tags" (
    "productId" TEXT NOT NULL,
    "tagId" INTEGER NOT NULL,

    CONSTRAINT "product_tags_pkey" PRIMARY KEY ("productId","tagId")
);

-- CreateTable
CREATE TABLE "public"."product_options" (
    "id" SERIAL NOT NULL,
    "productId" TEXT NOT NULL,
    "name" VARCHAR(64) NOT NULL,
    "type" "public"."OptionType" NOT NULL,
    "displayInPreview" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "product_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."option_values" (
    "id" SERIAL NOT NULL,
    "optionId" INTEGER NOT NULL,
    "value" VARCHAR(64) NOT NULL,
    "sortOrder" INTEGER,

    CONSTRAINT "option_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."variants" (
    "id" INTEGER NOT NULL,
    "productId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "costCents" INTEGER NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "grams" INTEGER NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "isPrintifyExpressEligible" BOOLEAN NOT NULL DEFAULT false,
    "quantity" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."variant_option_values" (
    "variantId" INTEGER NOT NULL,
    "optionValueId" INTEGER NOT NULL,

    CONSTRAINT "variant_option_values_pkey" PRIMARY KEY ("variantId","optionValueId")
);

-- CreateTable
CREATE TABLE "public"."images" (
    "id" BIGSERIAL NOT NULL,
    "productId" TEXT NOT NULL,
    "src" TEXT NOT NULL,
    "position" "public"."Position",
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isSelectedForPublishing" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER,

    CONSTRAINT "images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."image_variants" (
    "imageId" BIGINT NOT NULL,
    "variantId" INTEGER NOT NULL,

    CONSTRAINT "image_variants_pkey" PRIMARY KEY ("imageId","variantId")
);

-- CreateTable
CREATE TABLE "public"."print_areas" (
    "id" SERIAL NOT NULL,
    "productId" TEXT NOT NULL,
    "background" VARCHAR(16),
    "placeholders" JSONB,

    CONSTRAINT "print_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."print_area_variants" (
    "printAreaId" INTEGER NOT NULL,
    "variantId" INTEGER NOT NULL,

    CONSTRAINT "print_area_variants_pkey" PRIMARY KEY ("printAreaId","variantId")
);

-- CreateTable
CREATE TABLE "public"."views" (
    "id" INTEGER NOT NULL,
    "productId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "position" "public"."Position",

    CONSTRAINT "views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."view_files" (
    "id" BIGSERIAL NOT NULL,
    "viewId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "role" VARCHAR(64),
    "data" JSONB,

    CONSTRAINT "view_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "products_creatorEmail_idx" ON "public"."products"("creatorEmail");

-- CreateIndex
CREATE INDEX "products_visible_isDeleted_idx" ON "public"."products"("visible", "isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "public"."tags"("name");

-- CreateIndex
CREATE INDEX "product_tags_tagId_idx" ON "public"."product_tags"("tagId");

-- CreateIndex
CREATE INDEX "product_options_productId_type_idx" ON "public"."product_options"("productId", "type");

-- CreateIndex
CREATE INDEX "option_values_optionId_idx" ON "public"."option_values"("optionId");

-- CreateIndex
CREATE UNIQUE INDEX "option_values_optionId_value_key" ON "public"."option_values"("optionId", "value");

-- CreateIndex
CREATE UNIQUE INDEX "variants_sku_key" ON "public"."variants"("sku");

-- CreateIndex
CREATE INDEX "variants_productId_isDefault_idx" ON "public"."variants"("productId", "isDefault");

-- CreateIndex
CREATE INDEX "variants_productId_isAvailable_idx" ON "public"."variants"("productId", "isAvailable");

-- CreateIndex
CREATE INDEX "variant_option_values_optionValueId_idx" ON "public"."variant_option_values"("optionValueId");

-- CreateIndex
CREATE INDEX "images_productId_isDefault_idx" ON "public"."images"("productId", "isDefault");

-- CreateIndex
CREATE INDEX "images_productId_position_idx" ON "public"."images"("productId", "position");

-- CreateIndex
CREATE INDEX "image_variants_variantId_idx" ON "public"."image_variants"("variantId");

-- CreateIndex
CREATE INDEX "print_areas_productId_idx" ON "public"."print_areas"("productId");

-- CreateIndex
CREATE INDEX "print_area_variants_variantId_idx" ON "public"."print_area_variants"("variantId");

-- CreateIndex
CREATE INDEX "views_productId_position_idx" ON "public"."views"("productId", "position");

-- CreateIndex
CREATE INDEX "view_files_viewId_idx" ON "public"."view_files"("viewId");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "public"."Account"("userId");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "public"."Session"("userId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_handle_idx" ON "public"."User"("handle");

-- CreateIndex
CREATE INDEX "VerificationToken_expires_idx" ON "public"."VerificationToken"("expires");

-- AddForeignKey
ALTER TABLE "public"."product_tags" ADD CONSTRAINT "product_tags_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."product_tags" ADD CONSTRAINT "product_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "public"."tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."product_options" ADD CONSTRAINT "product_options_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."option_values" ADD CONSTRAINT "option_values_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "public"."product_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."variants" ADD CONSTRAINT "variants_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."variant_option_values" ADD CONSTRAINT "variant_option_values_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "public"."variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."variant_option_values" ADD CONSTRAINT "variant_option_values_optionValueId_fkey" FOREIGN KEY ("optionValueId") REFERENCES "public"."option_values"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."images" ADD CONSTRAINT "images_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."image_variants" ADD CONSTRAINT "image_variants_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "public"."images"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."image_variants" ADD CONSTRAINT "image_variants_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "public"."variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."print_areas" ADD CONSTRAINT "print_areas_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."print_area_variants" ADD CONSTRAINT "print_area_variants_printAreaId_fkey" FOREIGN KEY ("printAreaId") REFERENCES "public"."print_areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."print_area_variants" ADD CONSTRAINT "print_area_variants_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "public"."variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."views" ADD CONSTRAINT "views_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."view_files" ADD CONSTRAINT "view_files_viewId_fkey" FOREIGN KEY ("viewId") REFERENCES "public"."views"("id") ON DELETE CASCADE ON UPDATE CASCADE;
