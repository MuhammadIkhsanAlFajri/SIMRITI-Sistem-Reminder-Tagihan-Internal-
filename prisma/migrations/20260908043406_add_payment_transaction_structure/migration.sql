/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Made the column `dueDate` on table `Bill` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `dueDate` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `periodDate` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."BillType" AS ENUM ('NORMAL', 'BERULANG');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('MENUNGGU_PEMBAYARAN', 'AKAN_JATUH_TEMPO', 'TERLAMBAT', 'SUDAH_DIBAYAR');

-- DropForeignKey
ALTER TABLE "public"."Payment" DROP CONSTRAINT "Payment_billId_fkey";

-- DropIndex
DROP INDEX "public"."Payment_billId_key";

-- AlterTable
ALTER TABLE "public"."Bill" ADD COLUMN     "isRecurring" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastReminderSentAt" TIMESTAMP(3),
ADD COLUMN     "nextDueDate" TIMESTAMP(3),
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "previousDueDate" TIMESTAMP(3),
ADD COLUMN     "recurringMonths" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "recurringPeriod" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "type" "public"."BillType" NOT NULL DEFAULT 'NORMAL',
ALTER COLUMN "amount" DROP NOT NULL,
ALTER COLUMN "dueDate" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."Payment" ADD COLUMN     "amount" DOUBLE PRECISION,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "dueDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "periodDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "status" "public"."PaymentStatus" NOT NULL DEFAULT 'MENUNGGU_PEMBAYARAN',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "paymentDate" DROP NOT NULL,
ALTER COLUMN "proofFile" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "email" TEXT;

-- CreateTable
CREATE TABLE "public"."PasswordResetToken" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "public"."PasswordResetToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- AddForeignKey
ALTER TABLE "public"."PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_billId_fkey" FOREIGN KEY ("billId") REFERENCES "public"."Bill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
