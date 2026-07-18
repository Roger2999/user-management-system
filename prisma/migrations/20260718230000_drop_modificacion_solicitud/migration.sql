/*
  Warnings:

  - You are about to drop the enum value `MODIFICACION` from `TipoSolicitud`.
    Existing rows with `MODIFICACION` will be remapped to `ACTUALIZACION`.
*/

-- Remapear datos existentes antes de eliminar el valor del enum
UPDATE "AccountRequest" SET "tipoSolicitud" = 'ACTUALIZACION' WHERE "tipoSolicitud" = 'MODIFICACION';

-- Recrear el enum sin MODIFICACION
ALTER TYPE "TipoSolicitud" RENAME TO "TipoSolicitud_old";

CREATE TYPE "TipoSolicitud" AS ENUM ('ALTA', 'ACTUALIZACION');

ALTER TABLE "AccountRequest" ALTER COLUMN "tipoSolicitud" TYPE "TipoSolicitud" USING "tipoSolicitud"::text::"TipoSolicitud";

DROP TYPE "TipoSolicitud_old";
