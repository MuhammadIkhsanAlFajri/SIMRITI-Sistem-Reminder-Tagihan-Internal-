/*
  Warnings:

  - You are about to drop the column `frequency` on the `ReminderSetting` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Bill" ADD COLUMN     "lastEmailReminderSentAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."ReminderSetting" DROP COLUMN "frequency";
