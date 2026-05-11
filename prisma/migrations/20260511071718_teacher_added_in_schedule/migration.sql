/*
  Warnings:

  - Added the required column `teacherId` to the `Schedule` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Schedule" ADD COLUMN     "teacherId" TEXT NOT NULL;
