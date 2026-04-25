/*
  Warnings:

  - Added the required column `password` to the `clientes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "clientes" ADD COLUMN     "password" TEXT NOT NULL;
