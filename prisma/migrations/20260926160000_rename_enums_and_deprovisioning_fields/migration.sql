-- Rename the three enum types to English.
ALTER TYPE "TipoSolicitud" RENAME TO "RequestType";
ALTER TYPE "TipoPersonal" RENAME TO "StaffType";
ALTER TYPE "TipoCuenta" RENAME TO "AccountType";

-- Rename the enum values to English, preserving their original sort order.
ALTER TYPE "RequestType" RENAME VALUE 'ALTA' TO 'NEW';
ALTER TYPE "RequestType" RENAME VALUE 'ACTUALIZACION' TO 'UPDATE';
ALTER TYPE "RequestType" RENAME VALUE 'BAJA' TO 'DEPROVISIONING';
ALTER TYPE "StaffType" RENAME VALUE 'DIRECTIVO' TO 'EXECUTIVE';
ALTER TYPE "StaffType" RENAME VALUE 'ESPECIALISTA_PRINCIPAL' TO 'SENIOR_SPECIALIST';
ALTER TYPE "StaffType" RENAME VALUE 'TECNICO' TO 'TECHNICIAN';
ALTER TYPE "StaffType" RENAME VALUE 'OTRO' TO 'OTHER';
ALTER TYPE "AccountType" RENAME VALUE 'PERMANENTE' TO 'PERMANENT';
ALTER TYPE "AccountType" RENAME VALUE 'TEMPORAL' TO 'TEMPORARY';

-- Rename the columns. No index or constraint referenced these columns.
ALTER TABLE "AccountRequest" RENAME COLUMN "tipoSolicitud" TO "requestType";
ALTER TABLE "AccountRequest" RENAME COLUMN "tipoPersonal" TO "staffType";
ALTER TABLE "AccountRequest" RENAME COLUMN "tipoCuenta" TO "accountType";
ALTER TABLE "AccountRequest" RENAME COLUMN "motivosBaja" TO "deprovisioningReasons";
ALTER TABLE "AccountRequest" RENAME COLUMN "fechaBaja" TO "deprovisionedAt";
