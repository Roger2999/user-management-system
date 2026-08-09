/*
  Warnings:

  - You are about to drop the column `actividadRealiza` on the `AccountRequest` table. All the data in the column will be lost.
  - You are about to drop the column `administradorSistema` on the `AccountRequest` table. All the data in the column will be lost.
  - You are about to drop the column `chatInternet` on the `AccountRequest` table. All the data in the column will be lost.
  - You are about to drop the column `chatInternetFechaTemp` on the `AccountRequest` table. All the data in the column will be lost.
  - You are about to drop the column `correoInternetFechaTemp` on the `AccountRequest` table. All the data in the column will be lost.
  - You are about to drop the column `correoLocal` on the `AccountRequest` table. All the data in the column will be lost.
  - You are about to drop the column `cuenta` on the `AccountRequest` table. All the data in the column will be lost.
  - You are about to drop the column `cuentaUsuario` on the `AccountRequest` table. All the data in the column will be lost.
  - You are about to drop the column `ftpEntidadBorrar` on the `AccountRequest` table. All the data in the column will be lost.
  - You are about to drop the column `ftpEntidadLectura` on the `AccountRequest` table. All the data in the column will be lost.
  - You are about to drop the column `ftpEntidadModificar` on the `AccountRequest` table. All the data in the column will be lost.
  - You are about to drop the column `ftpUneBorrar` on the `AccountRequest` table. All the data in the column will be lost.
  - You are about to drop the column `ftpUneLectura` on the `AccountRequest` table. All the data in the column will be lost.
  - You are about to drop the column `ftpUneModificar` on the `AccountRequest` table. All the data in the column will be lost.
  - You are about to drop the column `internetFechaTemp` on the `AccountRequest` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AccountRequest" DROP COLUMN "actividadRealiza",
DROP COLUMN "administradorSistema",
DROP COLUMN "chatInternet",
DROP COLUMN "chatInternetFechaTemp",
DROP COLUMN "correoInternetFechaTemp",
DROP COLUMN "correoLocal",
DROP COLUMN "cuenta",
DROP COLUMN "cuentaUsuario",
DROP COLUMN "ftpEntidadBorrar",
DROP COLUMN "ftpEntidadLectura",
DROP COLUMN "ftpEntidadModificar",
DROP COLUMN "ftpUneBorrar",
DROP COLUMN "ftpUneLectura",
DROP COLUMN "ftpUneModificar",
DROP COLUMN "internetFechaTemp",
ADD COLUMN     "accesoNubeBorrar" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "accesoNubeControlTotal" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "accesoNubeLectura" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "accesoNubeModificar" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "horario24Horas" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "identificadorCuentaUsuario" TEXT,
ADD COLUMN     "instagram" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "telefonoExtension" TEXT,
ADD COLUMN     "telegram" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "usuario" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "whatsapp" BOOLEAN NOT NULL DEFAULT false;
