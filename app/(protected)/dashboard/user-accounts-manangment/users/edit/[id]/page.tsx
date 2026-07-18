import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import CreateUserAccountForm from "../../create/components/create-user-account-form";
import { updateAccountRequestAction } from "./actions/update-account-request-action";
import type { CreateUserAccountState } from "@/lib/types";

interface Props {
  params: Promise<{ id: string }>;
}

const toDateInput = (value: Date | null | undefined) =>
  value ? value.toISOString().split("T")[0] : undefined;

const opt = (value: string | null): string | undefined => value ?? undefined;

export default async function EditUserAccountPage({ params }: Props) {
  const { id } = await params;
  const user = await prisma.accountRequest.findUnique({ where: { id } });

  if (!user) {
    notFound();
  }

  const initialData: CreateUserAccountState["data"] = {
    id: user.id,
    tipoSolicitud: opt(user.tipoSolicitud),
    folio: opt(user.folio),
    nombreApellidos: opt(user.nombreApellidos),
    cargoOcupa: opt(user.cargoOcupa),
    departamentoArea: opt(user.departamentoArea),
    tipoPersonal: opt(user.tipoPersonal),
    cuenta: opt(user.cuenta),

    correoLocal: user.correoLocal,
    correoNacional: user.correoNacional,
    correoInternacional: user.correoInternacional,
    correoInternet: user.correoInternet,
    correoInternetFechaTemp: toDateInput(user.correoInternetFechaTemp),

    intranetUNE: user.intranetUNE,
    intranetNacional: user.intranetNacional,
    internet: user.internet,
    internetFechaTemp: toDateInput(user.internetFechaTemp),

    mensajeriaCorporativa: user.mensajeriaCorporativa,
    chatInternet: user.chatInternet,
    chatInternetFechaTemp: toDateInput(user.chatInternetFechaTemp),

    facebook: user.facebook,
    twitter: user.twitter,
    youtube: user.youtube,
    otrasRedes: opt(user.otrasRedes),

    adminRed: user.adminRed,
    adminLocal: user.adminLocal,
    usuarioAvanzado: user.usuarioAvanzado,

    ftpUneLectura: user.ftpUneLectura,
    ftpUneModificar: user.ftpUneModificar,
    ftpUneBorrar: user.ftpUneBorrar,

    ftpEntidadLectura: user.ftpEntidadLectura,
    ftpEntidadModificar: user.ftpEntidadModificar,
    ftpEntidadBorrar: user.ftpEntidadBorrar,

    tipoCuenta: opt(user.tipoCuenta),
    fechaExpiracion: toDateInput(user.fechaExpiracion),

    horarioExtralaboral: user.horarioExtralaboral,
    extraDesde: opt(user.extraDesde),
    extraHasta: opt(user.extraHasta),
    sabadoDesde: opt(user.sabadoDesde),
    sabadoHasta: opt(user.sabadoHasta),
    domingoDesde: opt(user.domingoDesde),
    domingoHasta: opt(user.domingoHasta),

    apnCorreoNacional: user.apnCorreoNacional,
    apnCorreoInternacional: user.apnCorreoInternacional,
    apnInternet: user.apnInternet,
    telefonoCelular: opt(user.telefonoCelular),

    pcNombre: opt(user.pcNombre),
    pcInventario: opt(user.pcInventario),
    pcAdicionalNombre: opt(user.pcAdicionalNombre),
    pcAdicionalInventario: opt(user.pcAdicionalInventario),

    softwareAutorizado: opt(user.softwareAutorizado),
    cuentaUsuario: opt(user.cuentaUsuario),
    actividadRealiza: opt(user.actividadRealiza),
    administradorSistema: user.administradorSistema,

    bajaEntidad: user.bajaEntidad,
    motivosBaja: opt(user.motivosBaja),
    fechaBaja: toDateInput(user.fechaBaja),
  };

  return (
    <div className="mx-auto max-w-2xl py-8">
      <CreateUserAccountForm
        mode="edit"
        id={id}
        initialData={initialData}
        action={updateAccountRequestAction}
      />
    </div>
  );
}
