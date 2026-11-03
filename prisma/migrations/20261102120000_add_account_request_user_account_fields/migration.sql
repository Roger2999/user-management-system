-- AlterTable
ALTER TABLE "AccountRequest" ADD COLUMN     "cuentaUsuario" TEXT,
ADD COLUMN     "actividadRealiza" TEXT,
ADD COLUMN     "administradorSistema" BOOLEAN NOT NULL DEFAULT false;
