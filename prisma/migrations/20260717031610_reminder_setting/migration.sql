/*
  Warnings:

  - You are about to drop the `Reminder` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Reminder" DROP CONSTRAINT "Reminder_billId_fkey";

-- DropTable
DROP TABLE "public"."Reminder";

-- CreateTable
CREATE TABLE "public"."ReminderSetting" (
    "id" SERIAL NOT NULL,
    "daysBefore" INTEGER NOT NULL DEFAULT 7,
    "frequency" INTEGER NOT NULL DEFAULT 1,
    "status" "public"."ReminderStatus" NOT NULL DEFAULT 'AKTIF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReminderSetting_pkey" PRIMARY KEY ("id")
);
