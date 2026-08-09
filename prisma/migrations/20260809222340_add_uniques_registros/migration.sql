/*
  Warnings:

  - A unique constraint covering the columns `[folio]` on the table `AccountRequest` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[telefonoExtension]` on the table `AccountRequest` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[identificadorCuentaUsuario]` on the table `AccountRequest` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[telefonoCelular]` on the table `AccountRequest` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[pcNombre]` on the table `AccountRequest` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[pcInventario]` on the table `AccountRequest` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[pcAdicionalNombre]` on the table `AccountRequest` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[pcAdicionalInventario]` on the table `AccountRequest` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "citext";

-- AlterTable
ALTER TABLE "AccountRequest" ALTER COLUMN "folio" SET DATA TYPE CITEXT,
ALTER COLUMN "telefonoCelular" SET DATA TYPE CITEXT,
ALTER COLUMN "pcNombre" SET DATA TYPE CITEXT,
ALTER COLUMN "pcInventario" SET DATA TYPE CITEXT,
ALTER COLUMN "pcAdicionalNombre" SET DATA TYPE CITEXT,
ALTER COLUMN "pcAdicionalInventario" SET DATA TYPE CITEXT,
ALTER COLUMN "identificadorCuentaUsuario" SET DATA TYPE CITEXT,
ALTER COLUMN "telefonoExtension" SET DATA TYPE CITEXT;

-- CreateIndex
CREATE UNIQUE INDEX "AccountRequest_folio_key" ON "AccountRequest"("folio");

-- CreateIndex
CREATE UNIQUE INDEX "AccountRequest_telefonoExtension_key" ON "AccountRequest"("telefonoExtension");

-- CreateIndex
CREATE UNIQUE INDEX "AccountRequest_identificadorCuentaUsuario_key" ON "AccountRequest"("identificadorCuentaUsuario");

-- CreateIndex
CREATE UNIQUE INDEX "AccountRequest_telefonoCelular_key" ON "AccountRequest"("telefonoCelular");

-- CreateIndex
CREATE UNIQUE INDEX "AccountRequest_pcNombre_key" ON "AccountRequest"("pcNombre");

-- CreateIndex
CREATE UNIQUE INDEX "AccountRequest_pcInventario_key" ON "AccountRequest"("pcInventario");

-- CreateIndex
CREATE UNIQUE INDEX "AccountRequest_pcAdicionalNombre_key" ON "AccountRequest"("pcAdicionalNombre");

-- CreateIndex
CREATE UNIQUE INDEX "AccountRequest_pcAdicionalInventario_key" ON "AccountRequest"("pcAdicionalInventario");
