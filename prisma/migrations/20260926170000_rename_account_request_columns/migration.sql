-- Rename AccountRequest columns to English (generated from the old/new schema diff).
-- Each RENAME COLUMN is its own statement: PostgreSQL allows only one per ALTER TABLE.

ALTER TABLE "AccountRequest" RENAME COLUMN "nombreApellidos" TO "fullName";
ALTER TABLE "AccountRequest" RENAME COLUMN "telefonoExtension" TO "phoneExtension";
ALTER TABLE "AccountRequest" RENAME COLUMN "departamentoArea" TO "department";
ALTER TABLE "AccountRequest" RENAME COLUMN "identificadorCuentaUsuario" TO "username";
ALTER TABLE "AccountRequest" RENAME COLUMN "correoNacional" TO "nationalEmail";
ALTER TABLE "AccountRequest" RENAME COLUMN "correoInternacional" TO "internationalEmail";
ALTER TABLE "AccountRequest" RENAME COLUMN "correoInternet" TO "internetEmail";
ALTER TABLE "AccountRequest" RENAME COLUMN "intranetNacional" TO "nationalIntranet";
ALTER TABLE "AccountRequest" RENAME COLUMN "mensajeriaCorporativa" TO "corporateMessaging";
ALTER TABLE "AccountRequest" RENAME COLUMN "otrasRedes" TO "otherNetworks";
ALTER TABLE "AccountRequest" RENAME COLUMN "usuario" TO "userAccount";
ALTER TABLE "AccountRequest" RENAME COLUMN "usuarioAvanzado" TO "advancedUserAccount";
ALTER TABLE "AccountRequest" RENAME COLUMN "adminLocal" TO "localAdmin";
ALTER TABLE "AccountRequest" RENAME COLUMN "adminRed" TO "networkAdmin";
ALTER TABLE "AccountRequest" RENAME COLUMN "accesoNubeLectura" TO "cloudAccessRead";
ALTER TABLE "AccountRequest" RENAME COLUMN "accesoNubeModificar" TO "cloudAccessModify";
ALTER TABLE "AccountRequest" RENAME COLUMN "accesoNubeBorrar" TO "cloudAccessDelete";
ALTER TABLE "AccountRequest" RENAME COLUMN "accesoNubeControlTotal" TO "cloudAccessFullControl";
ALTER TABLE "AccountRequest" RENAME COLUMN "fechaExpiracion" TO "expiresAt";
ALTER TABLE "AccountRequest" RENAME COLUMN "horarioExtralaboral" TO "overtimeSchedule";
ALTER TABLE "AccountRequest" RENAME COLUMN "horario24Horas" TO "aroundTheClockSchedule";
ALTER TABLE "AccountRequest" RENAME COLUMN "extraDesde" TO "overtimeFrom";
ALTER TABLE "AccountRequest" RENAME COLUMN "extraHasta" TO "overtimeTo";
ALTER TABLE "AccountRequest" RENAME COLUMN "sabadoDesde" TO "saturdayFrom";
ALTER TABLE "AccountRequest" RENAME COLUMN "sabadoHasta" TO "saturdayTo";
ALTER TABLE "AccountRequest" RENAME COLUMN "domingoDesde" TO "sundayFrom";
ALTER TABLE "AccountRequest" RENAME COLUMN "domingoHasta" TO "sundayTo";
ALTER TABLE "AccountRequest" RENAME COLUMN "apnCorreoNacional" TO "apnNationalEmail";
ALTER TABLE "AccountRequest" RENAME COLUMN "apnCorreoInternacional" TO "apnInternationalEmail";
ALTER TABLE "AccountRequest" RENAME COLUMN "telefonoCelular" TO "mobilePhone";
ALTER TABLE "AccountRequest" RENAME COLUMN "pcNombre" TO "pcName";
ALTER TABLE "AccountRequest" RENAME COLUMN "pcInventario" TO "pcAssetTag";
ALTER TABLE "AccountRequest" RENAME COLUMN "pcAdicionalNombre" TO "additionalPcName";
ALTER TABLE "AccountRequest" RENAME COLUMN "pcAdicionalInventario" TO "additionalPcAssetTag";
ALTER TABLE "AccountRequest" RENAME COLUMN "softwareAutorizado" TO "authorizedSoftware";

-- Prisma @unique creates a unique INDEX (pg_constraint only holds the pkey), and
-- PostgreSQL does NOT rename it when its column is renamed. Rename explicitly.
ALTER INDEX "AccountRequest_telefonoExtension_key" RENAME TO "AccountRequest_phoneExtension_key";
ALTER INDEX "AccountRequest_identificadorCuentaUsuario_key" RENAME TO "AccountRequest_username_key";
ALTER INDEX "AccountRequest_telefonoCelular_key" RENAME TO "AccountRequest_mobilePhone_key";
ALTER INDEX "AccountRequest_pcNombre_key" RENAME TO "AccountRequest_pcName_key";
ALTER INDEX "AccountRequest_pcInventario_key" RENAME TO "AccountRequest_pcAssetTag_key";
ALTER INDEX "AccountRequest_pcAdicionalNombre_key" RENAME TO "AccountRequest_additionalPcName_key";
ALTER INDEX "AccountRequest_pcAdicionalInventario_key" RENAME TO "AccountRequest_additionalPcAssetTag_key";
