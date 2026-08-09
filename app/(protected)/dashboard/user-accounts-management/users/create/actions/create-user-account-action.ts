"use server";

import z from "zod";
import { AccountRequestSchema } from "../models/account-request-schema.model";
import {
  findDuplicateFields,
  uniqueFieldMessage,
} from "../models/unique-account-request";
import prisma from "@/lib/prisma";
import { CreateUserAccountState } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createUserAccountAction(
  _prevState: CreateUserAccountState,
  formData: FormData,
): Promise<CreateUserAccountState> {
  const fields = {
    tipoSolicitud: (formData.get("tipoSolicitud") as string) || undefined,
    folio: formData.get("folio") as string,
    nombreApellidos: formData.get("nombreApellidos") as string,
    telefonoExtension:
      (formData.get("telefonoExtension") as string) || undefined,
    cargoOcupa: formData.get("cargoOcupa") as string,
    departamentoArea: formData.get("departamentoArea") as string,
    tipoPersonal: (formData.get("tipoPersonal") as string) || undefined,
    identificadorCuentaUsuario:
      (formData.get("identificadorCuentaUsuario") as string) || undefined,

    correoNacional: formData.get("correoNacional") === "on",
    correoInternacional: formData.get("correoInternacional") === "on",
    correoInternet: formData.get("correoInternet") === "on",

    intranetUNE: formData.get("intranetUNE") === "on",
    intranetNacional: formData.get("intranetNacional") === "on",
    internet: formData.get("internet") === "on",

    mensajeriaCorporativa: formData.get("mensajeriaCorporativa") === "on",

    facebook: formData.get("facebook") === "on",
    twitter: formData.get("twitter") === "on",
    youtube: formData.get("youtube") === "on",
    whatsapp: formData.get("whatsapp") === "on",
    telegram: formData.get("telegram") === "on",
    instagram: formData.get("instagram") === "on",
    otrasRedes: (formData.get("otrasRedes") as string) || undefined,

    usuario: formData.get("usuario") === "on",
    usuarioAvanzado: formData.get("usuarioAvanzado") === "on",
    adminLocal: formData.get("adminLocal") === "on",
    adminRed: formData.get("adminRed") === "on",

    accesoNubeLectura: formData.get("accesoNubeLectura") === "on",
    accesoNubeModificar: formData.get("accesoNubeModificar") === "on",
    accesoNubeBorrar: formData.get("accesoNubeBorrar") === "on",
    accesoNubeControlTotal: formData.get("accesoNubeControlTotal") === "on",

    tipoCuenta: (formData.get("tipoCuenta") as string) || undefined,
    fechaExpiracion: (formData.get("fechaExpiracion") as string) || undefined,

    horarioExtralaboral: formData.get("horarioExtralaboral") === "on",
    horario24Horas: formData.get("horario24Horas") === "on",
    extraDesde: (formData.get("extraDesde") as string) || undefined,
    extraHasta: (formData.get("extraHasta") as string) || undefined,
    sabadoDesde: (formData.get("sabadoDesde") as string) || undefined,
    sabadoHasta: (formData.get("sabadoHasta") as string) || undefined,
    domingoDesde: (formData.get("domingoDesde") as string) || undefined,
    domingoHasta: (formData.get("domingoHasta") as string) || undefined,

    apnCorreoNacional: formData.get("apnCorreoNacional") === "on",
    apnCorreoInternacional: formData.get("apnCorreoInternacional") === "on",
    apnInternet: formData.get("apnInternet") === "on",
    telefonoCelular: (formData.get("telefonoCelular") as string) || undefined,

    pcNombre: (formData.get("pcNombre") as string) || undefined,
    pcInventario: (formData.get("pcInventario") as string) || undefined,
    pcAdicionalNombre:
      (formData.get("pcAdicionalNombre") as string) || undefined,
    pcAdicionalInventario:
      (formData.get("pcAdicionalInventario") as string) || undefined,

    softwareAutorizado:
      (formData.get("softwareAutorizado") as string) || undefined,
    //cuentaUsuario: formData.get("cuentaUsuario") as string,
    //actividadRealiza: (formData.get("actividadRealiza") as string) || undefined,
    //  administradorSistema: formData.get("administradorSistema") === "on",
    motivosBaja: (formData.get("motivosBaja") as string) || undefined,
    fechaBaja: (formData.get("fechaBaja") as string) || undefined,
  };

  const repopulateData = {
    tipoSolicitud: fields.tipoSolicitud,
    folio: fields.folio,
    nombreApellidos: fields.nombreApellidos,
    telefonoExtension: fields.telefonoExtension,
    cargoOcupa: fields.cargoOcupa,
    departamentoArea: fields.departamentoArea,
    tipoPersonal: fields.tipoPersonal,
    identificadorCuentaUsuario: fields.identificadorCuentaUsuario,
    correoInternet: fields.correoInternet,
    otrasRedes: fields.otrasRedes,
    tipoCuenta: fields.tipoCuenta,
    fechaExpiracion: fields.fechaExpiracion,
    horario24Horas: fields.horario24Horas,
    extraDesde: fields.extraDesde,
    extraHasta: fields.extraHasta,
    sabadoDesde: fields.sabadoDesde,
    sabadoHasta: fields.sabadoHasta,
    domingoDesde: fields.domingoDesde,
    domingoHasta: fields.domingoHasta,
    telefonoCelular: fields.telefonoCelular,
    pcNombre: fields.pcNombre,
    pcInventario: fields.pcInventario,
    pcAdicionalNombre: fields.pcAdicionalNombre,
    pcAdicionalInventario: fields.pcAdicionalInventario,
    softwareAutorizado: fields.softwareAutorizado,
    // cuentaUsuario: fields.cuentaUsuario,
    motivosBaja: fields.motivosBaja,
    fechaBaja: fields.fechaBaja,
  };

  const validatedFields = AccountRequestSchema.safeParse(fields);

  if (!validatedFields.success) {
    return {
      data: repopulateData,
      success: false,
      dbErrors: null,
      validationErrors: z.flattenError(validatedFields.error).fieldErrors,
    };
  }

  const duplicatedFields = await findDuplicateFields(validatedFields.data);

  if (duplicatedFields.length > 0) {
    return {
      data: repopulateData,
      success: false,
      dbErrors: null,
      validationErrors: Object.fromEntries(
        duplicatedFields.map((field) => [field, [uniqueFieldMessage(field)]]),
      ),
    };
  }

  const toDate = (value: string | undefined) =>
    value ? new Date(value) : null;

  try {
    const data = validatedFields.data;

    await prisma.accountRequest.create({
      data: {
        ...data,
        fechaExpiracion: toDate(data.fechaExpiracion),
        fechaBaja: toDate(data.fechaBaja),
        firmadoPorSolicitado: false,
        firmadoPorRevisado: false,
        firmadoPorAprobado: false,
        firmadoPorEjecutado: false,
      },
    });
  } catch {
    return {
      data: repopulateData,
      success: false,
      dbErrors: {
        message: "Error al procesar la solicitud. Intenta de nuevo.",
      },
      validationErrors: null,
    };
  }
  revalidatePath("/dashboard/user-accounts-management/users");
  redirect("/dashboard/user-accounts-management/users?success=created");
}
