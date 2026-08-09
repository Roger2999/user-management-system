import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import EditUserAccountForm from "../../components/user-account-form";
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
    telefonoExtension: opt(user.telefonoExtension),
    cargoOcupa: opt(user.cargoOcupa),
    departamentoArea: opt(user.departamentoArea),
    tipoPersonal: opt(user.tipoPersonal),
    identificadorCuentaUsuario: opt(user.identificadorCuentaUsuario),

    correoNacional: user.correoNacional,
    correoInternacional: user.correoInternacional,
    correoInternet: user.correoInternet,

    intranetUNE: user.intranetUNE,
    intranetNacional: user.intranetNacional,
    internet: user.internet,

    mensajeriaCorporativa: user.mensajeriaCorporativa,

    facebook: user.facebook,
    twitter: user.twitter,
    youtube: user.youtube,
    whatsapp: user.whatsapp,
    telegram: user.telegram,
    instagram: user.instagram,
    otrasRedes: opt(user.otrasRedes),

    usuario: user.usuario,
    usuarioAvanzado: user.usuarioAvanzado,
    adminLocal: user.adminLocal,
    adminRed: user.adminRed,

    accesoNubeLectura: user.accesoNubeLectura,
    accesoNubeModificar: user.accesoNubeModificar,
    accesoNubeBorrar: user.accesoNubeBorrar,
    accesoNubeControlTotal: user.accesoNubeControlTotal,

    tipoCuenta: opt(user.tipoCuenta),
    fechaExpiracion: toDateInput(user.fechaExpiracion),

    horarioExtralaboral: user.horarioExtralaboral,
    horario24Horas: user.horario24Horas,
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
    // cuentaUsuario: opt(user.cuentaUsuario),
    // actividadRealiza: opt(user.actividadRealiza),
    // administradorSistema: user.administradorSistema,

    motivosBaja: opt(user.motivosBaja),
    fechaBaja: toDateInput(user.fechaBaja),
  };

  return (
    <div className="py-8">
      <EditUserAccountForm
        mode="edit"
        id={id}
        initialData={initialData}
        action={updateAccountRequestAction}
      />
    </div>
  );
}
