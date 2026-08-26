import type { AccountRequest } from "@/generated/prisma/client";
import { CB } from "../primitives";
import { Banner, OptionRow } from "../data-fields";
import { ServiceTitle, ContentRow } from "../content-components";

export function ServicesSection({ user }: { user: AccountRequest }) {
  return (
    <>
      <Banner>SERVICIOS REQUERIDOS</Banner>

      <ServiceTitle title={["CORREO ELECTRONICO"]} />
      <OptionRow label="Correo Nacional:" yes={user.correoNacional} />
      <OptionRow label="Correo Internacional:" yes={user.correoInternacional} />
      <OptionRow label="Correo Internet:" yes={user.correoInternet} />

      <ServiceTitle title={["NAVEGACIÓN WEB"]} />
      <OptionRow label="Intranet UNE:" yes={user.intranetUNE} />
      <OptionRow label="Intranet Nacional:" yes={user.intranetNacional} />
      <OptionRow label="Internet:" yes={user.internet} />

      <ServiceTitle title={["MENSAJERIA INSTANTÁNEA / CHAT"]} />
      <OptionRow label="Corporativa:" yes={user.mensajeriaCorporativa} />

      <ServiceTitle title={["REDES SOCIALES"]} />
      <ContentRow
        h={28.1}
        lines={[
          <span key="r1" className="flex gap-2">
            <span>Facebook</span>
            <CB checked={user.facebook} />
            <span>Twitter</span>
            <CB checked={user.twitter} />
            <span>YouTube</span>
            <CB checked={user.youtube} />
          </span>,
          <span key="r2" className="flex gap-2">
            <span>WhatsApp</span>
            <CB checked={user.whatsapp} />
            <span>Telegram</span>
            <CB checked={user.telegram} />
            <span>Instagram</span>
            <CB checked={user.instagram} />
          </span>,
          <span key="r3" className="flex items-center gap-2">
            <span>Otras</span>
            <CB checked={Boolean(user.otrasRedes)} />
            <span>Especificar:</span>
            <span className="min-w-[100pt]">{user.otrasRedes || ""}</span>
          </span>,
        ]}
      />

      <ServiceTitle
        title={["PRIVILEGIOS DE USUARIO SOBRE LA RED Y EL", "ORDENADOR"]}
        lines={2}
      />
      <OptionRow label="Usuario" yes={user.usuario} />
      <OptionRow label="Usuario Avanzado" yes={user.usuarioAvanzado} />
      <OptionRow label="Administrador Local" yes={user.adminLocal} />
      <OptionRow label="Administrador de Red" yes={user.adminRed} />

      <ServiceTitle title={["ACCESO NUBE UNE"]} />
      <ContentRow
        h={18.9}
        lines={[
          <span key="n1" className="flex gap-2">
            <span>Solo lectura</span>
            <CB checked={user.accesoNubeLectura} />
            <span>Modificar</span>
            <CB checked={user.accesoNubeModificar} />
            <span>Borrar</span>
            <CB checked={user.accesoNubeBorrar} />
          </span>,
          <span key="n2" className="flex gap-2">
            <span>Control total</span>
            <CB checked={user.accesoNubeControlTotal} />
          </span>,
        ]}
      />
    </>
  );
}
