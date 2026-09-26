-- RenameOperatorField: cargo -> charge
-- Renamed in place instead of DROP + ADD so the existing operator title
-- ("Especialista B en Ciencias Informáticas") is preserved.
ALTER TABLE "user" RENAME COLUMN "cargo" TO "charge";

-- AlterField
-- Safe at this point: the only remaining row has a non-null value.
ALTER TABLE "user" ALTER COLUMN "charge" SET NOT NULL;

-- AddField: fullName
-- Nullable on purpose: required by the signup form, but existing operators
-- have no name on file yet.
ALTER TABLE "user" ADD COLUMN "fullName" TEXT;
