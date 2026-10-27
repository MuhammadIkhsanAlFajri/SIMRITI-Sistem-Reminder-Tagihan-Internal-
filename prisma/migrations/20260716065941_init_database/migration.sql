-- CreateEnum
CREATE TYPE "public"."BillStatus" AS ENUM ('MENUNGGU_PEMBAYARAN', 'AKAN_JATUH_TEMPO', 'TERLAMBAT', 'SUDAH_DIBAYAR');

-- CreateEnum
CREATE TYPE "public"."ReminderStatus" AS ENUM ('AKTIF', 'NONAKTIF');

-- CreateEnum
CREATE TYPE "public"."ActivityType" AS ENUM ('LOGIN', 'LOGOUT', 'TAMBAH_TAGIHAN', 'EDIT_TAGIHAN', 'HAPUS_TAGIHAN', 'UBAH_STATUS');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Vendor" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Bill" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "invoiceDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "invoiceFile" TEXT,
    "status" "public"."BillStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "vendorId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Bill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Reminder" (
    "id" SERIAL NOT NULL,
    "daysBefore" INTEGER NOT NULL,
    "frequency" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "public"."ReminderStatus" NOT NULL,
    "billId" INTEGER NOT NULL,

    CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Payment" (
    "id" SERIAL NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "proofFile" TEXT NOT NULL,
    "note" TEXT,
    "billId" INTEGER NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ActivityLog" (
    "id" SERIAL NOT NULL,
    "activity" "public"."ActivityType" NOT NULL,
    "detail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Notification" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "public"."User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_name_key" ON "public"."Vendor"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Reminder_billId_key" ON "public"."Reminder"("billId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_billId_key" ON "public"."Payment"("billId");

-- AddForeignKey
ALTER TABLE "public"."Bill" ADD CONSTRAINT "Bill_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "public"."Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Bill" ADD CONSTRAINT "Bill_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Reminder" ADD CONSTRAINT "Reminder_billId_fkey" FOREIGN KEY ("billId") REFERENCES "public"."Bill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_billId_fkey" FOREIGN KEY ("billId") REFERENCES "public"."Bill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
