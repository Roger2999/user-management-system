"use server";

import z from "zod";
import { AccountRequestSchema } from "../../../create/models/account-request-schema.model";
import prisma from "@/lib/prisma";
import { CreateUserAccountState } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateAccountRequestAction(
  _prevState: CreateUserAccountState,
  formData: FormData,
): Promise<CreateUserAccountState> {
  const id = (formData.get("id") as string) || "";

  const fields = {
    tipoSolicitud: (formData.get("tipoSolicitud") as string) || undefined,
    folio: formData.get("folio") as string,
    nombreApellidos: formData.get("nombreApellidos") as string,
    cargoOcupa: formData.get("cargoOcupa") as string,
    departamentoArea: formData.get("departamentoArea") as string,
    tipoPersonal: (formData.get("tipoPersonal") as string) || undefined,
    cuenta: formData.get("cuenta") as string,

    correoLocal: formData.get("correoLocal") === "on",
    correoNacional: formData.get("correoNacional") === "on",
    correoInternacional: formData.get("correoInternacional") === "on",
    correoInternet: formData.get("correoInternet") === "on",
    correoInternetFechaTemp:
      (formData.get("correoInternetFechaTemp") as string) || undefined,

    intranetUNE: formData.get("intranetUNE") === "on",
    intranetNacional: formData.get("intranetNacional") === "on",
    internet: formData.get("internet") === "on",
    internetFechaTemp:
      (formData.get("internetFechaTemp") as string) || undefined,

    mensajeriaCorporativa: formData.get("mensajeriaCorporativa") === "on",
    chatInternet: formData.get("chatInternet") === "on",
    chatInternetFechaTemp:
      (formData.get("chatInternetFechaTemp") as string) || undefined,

    facebook: formData.get("facebook") === "on",
    twitter: formData.get("twitter") === "on",
    youtube: formData.get("youtube") === "on",
    otrasRedes: (formData.get("otrasRedes") as string) || undefined,

    adminRed: formData.get("adminRed") === "on",
    adminLocal: formData.get("adminLocal") === "on",
    usuarioAvanzado: formData.get("usuarioAvanzado") === "on",

    ftpUneLectura: formData.get("ftpUneLectura") === "on",
    ftpUneModificar: formData.get("ftpUneModificar") === "on",
    ftpUneBorrar: formData.get("ftpUneBorrar") === "on",

    ftpEntidadLectura: formData.get("ftpEntidadLectura") === "on",
    ftpEntidadModificar: formData.get("ftpEntidadModificar") === "on",
    ftpEntidadBorrar: formData.get("ftpEntidadBorrar") === "on",

    tipoCuenta: (formData.get("tipoCuenta") as string) || undefined,
    fechaExpiracion: (formData.get("fechaExpiracion") as string) || undefined,

    horarioExtralaboral: formData.get("horarioExtralaboral") === "on",
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
    cuentaUsuario: formData.get("cuentaUsuario") as string,
    actividadRealiza: (formData.get("actividadRealiza") as string) || undefined,
    administradorSistema: formData.get("administradorSistema") === "on",

    motivosBaja: (formData.get("motivosBaja") as string) || undefined,
    fechaBaja: (formData.get("fechaBaja") as string) || undefined,
  };

  const repopulateData = {
    id,
    tipoSolicitud: fields.tipoSolicitud,
    folio: fields.folio,
    nombreApellidos: fields.nombreApellidos,
    cargoOcupa: fields.cargoOcupa,
    departamentoArea: fields.departamentoArea,
    tipoPersonal: fields.tipoPersonal,
    cuenta: fields.cuenta,
    correoInternetFechaTemp: fields.correoInternetFechaTemp,
    internetFechaTemp: fields.internetFechaTemp,
    chatInternetFechaTemp: fields.chatInternetFechaTemp,
    otrasRedes: fields.otrasRedes,
    tipoCuenta: fields.tipoCuenta,
    fechaExpiracion: fields.fechaExpiracion,
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
    cuentaUsuario: fields.cuentaUsuario,
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

  const toDate = (value: string | undefined) =>
    value ? new Date(value) : null;

  try {
    const data = validatedFields.data;

    await prisma.accountRequest.update({
      where: { id },
      data: {
        ...data,
        correoInternetFechaTemp: toDate(data.correoInternetFechaTemp),
        internetFechaTemp: toDate(data.internetFechaTemp),
        chatInternetFechaTemp: toDate(data.chatInternetFechaTemp),
        fechaExpiracion: toDate(data.fechaExpiracion),
        fechaBaja: toDate(data.fechaBaja),
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      return {
        data: repopulateData,
        success: false,
        dbErrors: { message: error.message, name: error.name },
        validationErrors: null,
      };
    }

    return {
      data: repopulateData,
      success: false,
      dbErrors: { message: "Error inesperado" },
      validationErrors: null,
    };
  }

  revalidatePath("/dashboard/user-accounts-manangment/");
  redirect("/dashboard/user-accounts-manangment/");
}
