-- CreateEnum
CREATE TYPE "AccountRequestStage" AS ENUM ('requested', 'revised', 'approved', 'executed');

-- CreateTable
CREATE TABLE "AccountRequestSignature" (
    "id" TEXT NOT NULL,
    "accountRequestId" TEXT NOT NULL,
    "stage" "AccountRequestStage" NOT NULL,
    "nombre" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountRequestSignature_pkey" PRIMARY KEY ("id")
);

-- Backfill: migrar las firmas existentes de las columnas booleanas/fecha a la tabla nueva
-- antes de dropear las columnas viejas.
INSERT INTO "AccountRequestSignature" ("id", "accountRequestId", "stage", "nombre", "cargo", "fecha")
SELECT gen_random_uuid()::text, "id", 'requested', 'SIN DATOS', 'SIN DATOS', "solicitadoFecha"
FROM "AccountRequest" WHERE "solicitadoFecha" IS NOT NULL;

INSERT INTO "AccountRequestSignature" ("id", "accountRequestId", "stage", "nombre", "cargo", "fecha")
SELECT gen_random_uuid()::text, "id", 'revised', 'SIN DATOS', 'SIN DATOS', "revisadoFecha"
FROM "AccountRequest" WHERE "revisadoFecha" IS NOT NULL;

INSERT INTO "AccountRequestSignature" ("id", "accountRequestId", "stage", "nombre", "cargo", "fecha")
SELECT gen_random_uuid()::text, "id", 'approved', 'SIN DATOS', 'SIN DATOS', "aprobadoFecha"
FROM "AccountRequest" WHERE "aprobadoFecha" IS NOT NULL;

INSERT INTO "AccountRequestSignature" ("id", "accountRequestId", "stage", "nombre", "cargo", "fecha")
SELECT gen_random_uuid()::text, "id", 'executed', 'SIN DATOS', 'SIN DATOS', "ejecutadoFecha"
FROM "AccountRequest" WHERE "ejecutadoFecha" IS NOT NULL;

-- AlterTable
ALTER TABLE "AccountRequest" DROP COLUMN "aprobadoFecha",
DROP COLUMN "ejecutadoFecha",
DROP COLUMN "firmadoPorAprobado",
DROP COLUMN "firmadoPorEjecutado",
DROP COLUMN "firmadoPorRevisado",
DROP COLUMN "firmadoPorSolicitado",
DROP COLUMN "revisadoFecha",
DROP COLUMN "solicitadoFecha";

-- CreateIndex
CREATE INDEX "AccountRequestSignature_accountRequestId_idx" ON "AccountRequestSignature"("accountRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountRequestSignature_accountRequestId_stage_key" ON "AccountRequestSignature"("accountRequestId", "stage");

-- AddForeignKey
ALTER TABLE "AccountRequestSignature" ADD CONSTRAINT "AccountRequestSignature_accountRequestId_fkey" FOREIGN KEY ("accountRequestId") REFERENCES "AccountRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;