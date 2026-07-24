/*
  Warnings:

  - You are about to drop the column `bajaEntidad` on the `AccountRequest` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "TipoSolicitud" ADD VALUE 'BAJA';

-- AlterTable
ALTER TABLE "AccountRequest" DROP COLUMN "bajaEntidad";
