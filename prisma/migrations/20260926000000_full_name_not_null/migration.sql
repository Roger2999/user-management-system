-- AlterField
-- Guard: falls back to `name` (guaranteed NOT NULL) for any operator still
-- missing a full name, so the constraint can be applied on a database that
-- has not been backfilled by hand yet. No-op on an already-backfilled row.
UPDATE "user" SET "fullName" = "name" WHERE "fullName" IS NULL;

-- Safe at this point: zero rows remain NULL after the statement above.
ALTER TABLE "user" ALTER COLUMN "fullName" SET NOT NULL;
