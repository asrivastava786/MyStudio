-- CreateTable
CREATE TABLE "public"."catalog_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "blueprintId" INTEGER NOT NULL,
    "printProviderId" INTEGER NOT NULL,
    "mockupUrl" TEXT NOT NULL,
    "overlayUrl" TEXT,
    "blendMode" TEXT NOT NULL DEFAULT 'multiply',
    "canvasW" INTEGER NOT NULL,
    "canvasH" INTEGER NOT NULL,
    "zones" JSONB NOT NULL,
    "defaultVariants" INTEGER[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalog_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "catalog_templates_active_idx" ON "public"."catalog_templates"("active");
