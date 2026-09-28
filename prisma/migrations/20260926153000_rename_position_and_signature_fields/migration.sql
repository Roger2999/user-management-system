-- RenameOperatorField: charge -> position
--
-- `prisma migrate dev` needs a shadow database to infer that these are renames
-- rather than drop + add. The migration user (prisma_migration) has
-- CREATEDB=false, so the shadow database cannot be created and the command
-- fails with P1001. Running `migrate diff` against the live database without a
-- shadow database emits DROP COLUMN + ADD COLUMN, which would destroy every
-- existing signature row. The renames are therefore written explicitly.

-- AlterTable
ALTER TABLE "user" RENAME COLUMN "charge" TO "position";

-- AlterTable
ALTER TABLE "AccountRequest" RENAME COLUMN "cargoOcupa" TO "currentPosition";

-- AlterTable
-- PostgreSQL allows only one RENAME COLUMN per ALTER TABLE statement.
ALTER TABLE "AccountRequestSignature" RENAME COLUMN "nombre" TO "fullName";
ALTER TABLE "AccountRequestSignature" RENAME COLUMN "cargo" TO "position";
ALTER TABLE "AccountRequestSignature" RENAME COLUMN "fecha" TO "signedAt";
ALTER TABLE "AccountRequestSignature"
RENAME COLUMN "registradoPorUserId" TO "registeredByUserId";
ALTER TABLE "AccountRequestSignature"
RENAME COLUMN "registradoPorNombre" TO "registeredByName";
ALTER TABLE "AccountRequestSignature"
RENAME COLUMN "historialCorrecciones" TO "correctionHistory";

-- RenameIndex
ALTER INDEX "AccountRequestSignature_registradoPorUserId_idx"
RENAME TO "AccountRequestSignature_registeredByUserId_idx";

-- RenameForeignKey
ALTER TABLE "AccountRequestSignature"
RENAME CONSTRAINT "AccountRequestSignature_registradoPorUserId_fkey"
TO "AccountRequestSignature_registeredByUserId_fkey";
