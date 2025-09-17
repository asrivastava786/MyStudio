/*
  Warnings:

  - You are about to drop the column `token` on the `PasswordResetToken` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[tokenHash]` on the table `PasswordResetToken` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `PasswordResetToken` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tokenHash` to the `PasswordResetToken` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."PasswordResetToken_token_key";

-- DropIndex
DROP INDEX "public"."PasswordResetToken_userId_idx";

-- AlterTable
ALTER TABLE "public"."PasswordResetToken" DROP COLUMN "token",
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "tokenHash" TEXT NOT NULL,
ADD COLUMN     "usedAt" TIMESTAMP(3),
ALTER COLUMN "userId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "public"."PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_email_idx" ON "public"."PasswordResetToken"("email");
