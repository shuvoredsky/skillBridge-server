/*
  Warnings:

  - You are about to drop the column `status` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Account" ALTER COLUMN "type" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "status";
