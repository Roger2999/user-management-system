/*
  Warnings:

  - You are about to drop the column `aprobadoCargo` on the `AccountRequest` table. All the data in the column will be lost.
  - You are about to drop the column `aprobadoNombre` on the `AccountRequest` table. All the data in the column will be lost.
  - You are about to drop the column `ejecutadoCargo` on the `AccountRequest` table. All the data in the column will be lost.
  - You are about to drop the column `ejecutadoNombre` on the `AccountRequest` table. All the data in the column will be lost.
  - You are about to drop the column `revisadoCargo` on the `AccountRequest` table. All the data in the column will be lost.
  - You are about to drop the column `revisadoNombre` on the `AccountRequest` table. All the data in the column will be lost.
  - You are about to drop the column `solicitadoCargo` on the `AccountRequest` table. All the data in the column will be lost.
  - You are about to drop the column `solicitadoNombre` on the `AccountRequest` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AccountRequest" DROP COLUMN "aprobadoCargo",
DROP COLUMN "aprobadoNombre",
DROP COLUMN "ejecutadoCargo",
DROP COLUMN "ejecutadoNombre",
DROP COLUMN "revisadoCargo",
DROP COLUMN "revisadoNombre",
DROP COLUMN "solicitadoCargo",
DROP COLUMN "solicitadoNombre",
ADD COLUMN     "firmadoPorAprobado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "firmadoPorEjecutado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "firmadoPorRevisado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "firmadoPorSolicitado" BOOLEAN NOT NULL DEFAULT false;
