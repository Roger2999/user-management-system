import type { AccountRequest } from "@/generated/prisma/client";
import { CB } from "../primitives";
import { Banner, OptionRow } from "../data-fields";
import { ServiceTitle, ContentRow } from "../content-components";

export function ServicesSection({ user }: { user: AccountRequest }) {
  return (
    <>
      <Banner>SERVICIOS REQUERIDOS</Banner>

      <ServiceTitle title={["CORREO ELECTRONICO"]} />
      <OptionRow label="Correo Nacional:" yes={user.nationalEmail} />
      <OptionRow label="Correo Internacional:" yes={user.internationalEmail} />
      <OptionRow label="Correo Internet:" yes={user.internetEmail} />

      <ServiceTitle title={["NAVEGACIÓN WEB"]} />
      <OptionRow label="Intranet UNE:" yes={user.intranetUNE} />
      <OptionRow label="Intranet Nacional:" yes={user.nationalIntranet} />
      <OptionRow label="Internet:" yes={user.internet} />

      <ServiceTitle title={["MENSAJERIA INSTANTÁNEA / CHAT"]} />
      <OptionRow label="Corporativa:" yes={user.corporateMessaging} />

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
            <CB checked={Boolean(user.otherNetworks)} />
            <span>Especificar:</span>
            <span className="min-w-[100pt]">{user.otherNetworks || ""}</span>
          </span>,
        ]}
      />

      <ServiceTitle
        title={["PRIVILEGIOS DE USUARIO SOBRE LA RED Y EL", "ORDENADOR"]}
        lines={2}
      />
      <OptionRow label="Usuario" yes={user.userAccount} />
      <OptionRow label="Usuario Avanzado" yes={user.advancedUserAccount} />
      <OptionRow label="Administrador Local" yes={user.localAdmin} />
      <OptionRow label="Administrador de Red" yes={user.networkAdmin} />

      <ServiceTitle title={["ACCESO NUBE UNE"]} />
      <ContentRow
        h={18.9}
        lines={[
          <span key="n1" className="flex gap-2">
            <span>Solo lectura</span>
            <CB checked={user.cloudAccessRead} />
            <span>Modificar</span>
            <CB checked={user.cloudAccessModify} />
            <span>Borrar</span>
            <CB checked={user.cloudAccessDelete} />
          </span>,
          <span key="n2" className="flex gap-2">
            <span>Control total</span>
            <CB checked={user.cloudAccessFullControl} />
          </span>,
        ]}
      />
    </>
  );
}
