import type { ReactNode } from "react";
import type { AccountRequest } from "@/generated/prisma/client";

interface Props {
  user: AccountRequest;
}

const formatDate = (date: Date | null | undefined): string => {
  if (!date) return "";
  return date.toLocaleDateString("es-CU");
};

/* ---------- Primitivas de presentación ---------- */

function Check({ label, checked }: { label?: string; checked: boolean }) {
  return (
    <span className="mr-1.5 inline-flex items-center gap-1 whitespace-nowrap">
      <span className="flex h-2.75 w-2.75 items-center justify-center border border-black text-[8px] leading-none font-bold">
        {checked ? "X" : ""}
      </span>
      {label ? <span>{label}</span> : null}
    </span>
  );
}

function Label({ children }: { children: ReactNode }) {
  return <span className="font-bold">{children}</span>;
}

function Value({ children }: { children: ReactNode }) {
  return <span className="flex-1">{children}</span>;
}

/* ---------- Celdas reutilizables ---------- */

function Cell({
  width,
  children,
  className = "",
}: {
  width: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-center p-0.75 ${width} ${className}`}>
      {children}
    </div>
  );
}

function Row({ children }: { children: ReactNode }) {
  return <div className="flex border-x border-b border-black">{children}</div>;
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="border border-b-0 border-black bg-[#e0e0e0] p-0.75 font-bold">
      {children}
    </div>
  );
}

function SubHeader({ left, right }: { left: string; right: string }) {
  return (
    <div className="flex border-x border-b border-black bg-[#f2f2f2] font-bold">
      <div className="w-[45%] p-0.75">{left}</div>
      <div className="w-[55%] border-l border-black p-0.75">{right}</div>
    </div>
  );
}

/* ---------- Firmas ---------- */

function SignatureBox({ children }: { children: ReactNode }) {
  return (
    <div className="border border-t-0 border-black">
      <div className="border-b border-black bg-[#e0e0e0] p-0.5 text-center font-bold">
        {children}
      </div>
      <div className="flex h-8">
        <div className="w-[40%] border-r border-black p-0.75">
          <Label>Nombre y apellidos:</Label>
        </div>
        <div className="w-[30%] border-r border-black p-0.75">
          <Label>Cargo:</Label>
        </div>
        <div className="w-[15%] border-r border-black p-0.75">
          <Label>Fecha:</Label>
        </div>
        <div className="w-[15%] p-0.75">
          <Label>Firma:</Label>
        </div>
      </div>
    </div>
  );
}

/* ---------- Documento ---------- */

export default function UserAccountDocument({ user }: Props) {
  return (
    <div className="font-sans text-[7.5px] leading-tight text-black">
      {/* ENCABEZADO SUPERIOR DE TRÁMITE */}
      <div className="mb-1 flex border border-black">
        <div className="w-[60%] p-1.5 text-[9.5px] font-bold">
          ANEXO OM-PP 0001. A1 Solicitud de cuenta de usuario y servicios de red
        </div>
        <div className="flex w-[40%] border-l border-black">
          <div className="flex flex-1 flex-col items-center justify-center border-r border-black p-0.5 text-[6.5px]">
            <span className="font-bold">ALTA</span>
            <Check checked={user.tipoSolicitud === "ALTA"} />
          </div>
          <div className="flex flex-1 flex-col items-center justify-center border-r border-black p-0.5 text-[6.5px]">
            <span className="font-bold">ACTUALIZACIÓN</span>
            <Check checked={user.tipoSolicitud === "ACTUALIZACION"} />
          </div>
          <div className="flex flex-1 flex-col items-center justify-center border-r border-black p-0.5 text-[6.5px]">
            <span className="font-bold">MODIFICACIÓN</span>
            <Check checked={false} />
          </div>
          <div className="flex flex-1 flex-col items-center justify-center p-0.5 text-[6.5px]">
            <span className="font-bold">FOLIO</span>
            <span className="mt-0.5">{user.folio || ""}</span>
          </div>
        </div>
      </div>

      {/* SECCIÓN 1: DATOS GENERALES */}
      <SectionTitle>
        SOLICITUD DE CUENTA DE USUARIO Y SERVICIOS DE RED
      </SectionTitle>

      <Row>
        <Cell width="w-1/2" className="border-r border-black">
          <Label>Nombre y apellidos:</Label>
          <Value>{user.nombreApellidos || ""}</Value>
        </Cell>
        <Cell width="w-1/2">
          <Label>Departamento/Área:</Label>
          <Value>{user.departamentoArea || ""}</Value>
        </Cell>
      </Row>

      <Row>
        <Cell width="w-1/2" className="border-r border-black">
          <Label>Cargo que ocupa:</Label>
          <Value>{user.cargoOcupa || ""}</Value>
        </Cell>
        <Cell width="w-1/2">
          <Label>Cuenta:</Label>
          <Value>{user.cuenta || ""}</Value>
        </Cell>
      </Row>

      <Row>
        <Cell width="w-full">
          <Label>Tipo de personal:</Label>
          <Check
            label="Directivo."
            checked={user.tipoPersonal === "DIRECTIVO"}
          />
          <Check
            label="Especialista principal (J. Grupo)"
            checked={user.tipoPersonal === "ESPECIALISTA_PRINCIPAL"}
          />
          <Check label="Técnico" checked={user.tipoPersonal === "TECNICO"} />
          <Check label="Otro" checked={user.tipoPersonal === "OTRO"} />
        </Cell>
      </Row>

      {/* SECCIÓN 2: MATRIZ DE SERVICIOS REQUERIDOS */}
      <SubHeader left="Servicios requeridos:" right="MOTIVO DE LA SOLICITUD" />

      {/* CORREO ELECTRÓNICO */}
      <Row>
        <Cell width="w-[45%]" className="border-r border-black">
          <div className="w-full">
            <div className="mb-0.5 font-bold">CORREO ELECTRONICO</div>
            <CheckRow label="Correo Local:" yes={user.correoLocal} />
            <CheckRow label="Correo Nacional:" yes={user.correoNacional} />
            <CheckRow
              label="Correo Internacional:"
              yes={user.correoInternacional}
            />
            <div className="flex items-center">
              <span className="w-22.5">Correo Internet:</span>
              <Check label="Si" checked={user.correoInternet === true} />
              <Check label="No" checked={user.correoInternet === false} />
              <span className="text-[6px]">No. Temp. ___/___/20__</span>
            </div>
          </div>
        </Cell>
        <Cell width="w-[55%]">
          <div className="h-10" />
        </Cell>
      </Row>

      {/* ACCESO A NAVEGACIÓN WEB */}
      <Row>
        <Cell width="w-[45%]" className="border-r border-black">
          <div className="w-full">
            <CheckRow label="Intranet UNE:" yes={user.intranetUNE} />
            <CheckRow label="Intranet Nacional:" yes={user.intranetNacional} />
            <div className="flex items-center">
              <span className="w-22.5">Internet:</span>
              <Check label="Si" checked={user.internet === true} />
              <Check label="No" checked={user.internet === false} />
              <span className="text-[6px]">No. Temp. ___/___/20__</span>
            </div>
          </div>
        </Cell>
        <Cell width="w-[55%]">
          <div className="h-10" />
        </Cell>
      </Row>

      {/* MENSAJERÍA INSTANTÁNEA / CHAT */}
      <Row>
        <Cell width="w-[45%]" className="border-r border-black">
          <div className="w-full">
            <div className="mb-0.5 font-bold">
              Mensajería Instantánea / Chat
            </div>
            <CheckRow label="Corporativa:" yes={user.mensajeriaCorporativa} />
            <div className="flex items-center">
              <span className="w-22.5">Chat Internet:</span>
              <Check label="Si" checked={user.chatInternet === true} />
              <Check label="No" checked={user.chatInternet === false} />
              <span className="text-[6px]">No. Temp. ___/___/20__</span>
            </div>
          </div>
        </Cell>
        <Cell width="w-[55%]">
          <div className="h-10" />
        </Cell>
      </Row>

      {/* REDES SOCIALES */}
      <Row>
        <Cell width="w-[45%]" className="border-r border-black">
          <div className="w-full">
            <div className="mb-0.5 font-bold">Redes Sociales</div>
            <div className="flex flex-wrap">
              <Check label="Facebook" checked={user.facebook} />
              <Check label="Twitter" checked={user.twitter} />
              <Check label="YouTube" checked={user.youtube} />
              <Check label="Otro" checked={!!user.otrasRedes} />
            </div>
          </div>
        </Cell>
        <Cell width="w-[55%]">
          <div className="h-10" />
        </Cell>
      </Row>

      {/* OTRAS Y PRIVILEGIOS */}
      <Row>
        <Cell width="w-[45%]" className="border-r border-black">
          <Label>Otras: Especificar:</Label>
          <Value>{user.otrasRedes || ""}</Value>
        </Cell>
        <Cell width="w-[55%]">
          <Label>Privilegios de usuario sobre la red y el ordenador:</Label>
        </Cell>
      </Row>
      <Row>
        <Cell width="w-[45%]" className="h-3.5 border-r border-black" />
        <Cell width="w-[55%]">
          <Check
            label="Administrador de Red"
            checked={user.adminRed === true}
          />
          <Check label="No" checked={user.adminRed === false} />
        </Cell>
      </Row>
      <Row>
        <Cell width="w-[45%]" className="h-3.5 border-r border-black" />
        <Cell width="w-[55%]">
          <Check
            label="Administrador Local"
            checked={user.adminLocal === true}
          />
          <Check label="No" checked={user.adminLocal === false} />
        </Cell>
      </Row>
      <Row>
        <Cell width="w-[45%]" className="h-3.5 border-r border-black" />
        <Cell width="w-[55%]">
          <Check
            label="Usuario avanzado"
            checked={user.usuarioAvanzado === true}
          />
          <Check label="No" checked={user.usuarioAvanzado === false} />
        </Cell>
      </Row>

      {/* COMPARTIMENTOS FTP */}
      <Row>
        <Cell width="w-1/2" className="border-r border-black">
          <Label>Acceso FTP UNE</Label>
          <Check label="Solo Lectura" checked={user.ftpUneLectura} />
          <Check label="Modificar" checked={user.ftpUneModificar} />
          <Check label="Borrar" checked={user.ftpUneBorrar} />
        </Cell>
        <Cell width="w-1/2">
          <Label>Acceso FTP Entidad</Label>
          <Check label="Solo Lectura" checked={user.ftpEntidadLectura} />
          <Check label="Modificar" checked={user.ftpEntidadModificar} />
          <Check label="Borrar" checked={user.ftpEntidadBorrar} />
        </Cell>
      </Row>

      {/* RESTRICCIONES DE TIEMPO Y EXPIRACIÓN */}
      <Row>
        <Cell width="w-2/5" className="border-r border-black">
          <Label>Tipo de cuenta:</Label>
          <Check
            label="Permanente"
            checked={user.tipoCuenta === "PERMANENTE"}
          />
          <Check label="Temporal" checked={user.tipoCuenta === "TEMPORAL"} />
        </Cell>
        <Cell width="w-3/5">
          <Label>En caso de cuenta temporal: Fecha de expiración:</Label>
          <Value>{formatDate(user.fechaExpiracion) || "__/__/20__"}</Value>
        </Cell>
      </Row>

      <Row>
        <Cell width="w-full">
          <Label>Días y horas de uso de la cuenta:</Label>
          <Check label="Lunes a Viernes" checked={!user.horarioExtralaboral} />
          <Check
            label="Horario Extralaboral"
            checked={user.horarioExtralaboral === true}
          />
          <span>
            De {user.extraDesde || "__"} hrs a {user.extraHasta || "__"} hrs.
          </span>
        </Cell>
      </Row>

      <Row>
        <Cell width="w-full">
          <Label>No laborables:</Label>
          <Check label="Sábado" checked={!!user.sabadoDesde} />
          <span>
            De {user.sabadoDesde || "__"} hrs a {user.sabadoHasta || "__"} hrs.
          </span>
          <Check label="Domingo" checked={!!user.domingoDesde} />
          <span>
            De {user.domingoDesde || "__"} hrs a {user.domingoHasta || "__"}{" "}
            hrs.
          </span>
        </Cell>
      </Row>

      {/* ASIGNACIONES TECNOLÓGICAS (APN / PC / SOFTWARE) */}
      <Row>
        <Cell width="w-full">
          <Label>Acceso por APN:</Label>
          <Check label="Correo nacional" checked={user.apnCorreoNacional} />
          <Check
            label="Correo internacional"
            checked={user.apnCorreoInternacional}
          />
          <Check label="Internet" checked={user.apnInternet} />
          <Label>Número teléfono celular:</Label>
          <Value>{user.telefonoCelular || "________________"}</Value>
        </Cell>
      </Row>

      <Row>
        <Cell width="w-1/2" className="border-r border-black">
          <Label>
            Se autoriza a utilizar el siguiente medio Informático (Nombre PC)
          </Label>
        </Cell>
        <Cell width="w-1/2">
          <Label>
            Se autoriza además a autenticarse en los siguientes PC (Nombre PC)
          </Label>
        </Cell>
      </Row>
      <Row>
        <Cell width="w-1/2" className="h-3.5 border-r border-black">
          <Value>{user.pcNombre || ""}</Value>
        </Cell>
        <Cell width="w-1/2" className="h-3.5">
          <Value>{user.pcAdicionalNombre || ""}</Value>
        </Cell>
      </Row>
      <Row>
        <Cell width="w-1/2" className="border-r border-black">
          <Label>No. Inventario:</Label>
          <Value>{user.pcInventario || ""}</Value>
        </Cell>
        <Cell width="w-1/2">
          <Label>No. Inventario:</Label>
          <Value>{user.pcAdicionalInventario || ""}</Value>
        </Cell>
      </Row>

      <Row>
        <Cell width="w-full">
          <Label>
            Software autorizado (Además del autorizado por política):
          </Label>
          <Value>{user.softwareAutorizado || ""}</Value>
        </Cell>
      </Row>

      <Row>
        <Cell width="w-[35%]" className="border-r border-black">
          <Label>Cuenta de Usuario:</Label>
          <Value>{user.cuentaUsuario || ""}</Value>
        </Cell>
        <Cell width="w-[40%]" className="border-r border-black">
          <Label>Actividad que realiza:</Label>
          <Value>{user.actividadRealiza || ""}</Value>
        </Cell>
        <Cell width="w-[25%]">
          <Label>Administrador de Sistema:</Label>
          <Check label="Si" checked={user.administradorSistema === true} />
          <Check label="No" checked={user.administradorSistema === false} />
        </Cell>
      </Row>

      {/* SECCIÓN 3: CUADROS DE REVISIÓN Y FIRMAS */}
      <div className="mt-1">
        <SignatureBox>
          SOLICITADO POR EL DIRECTOR QUE SOLICITA EL SERVICIO. (Este responde
          por los servicios solicitados)
        </SignatureBox>
        <SignatureBox>
          REVISADO POR: (Esp. Seguridad Informática y Tecnológica)
        </SignatureBox>
        <SignatureBox>
          APROBADO POR (Director que autoriza el servicio o persona designada
          por Resolución del Director General de la Entidad)
        </SignatureBox>
        <SignatureBox>
          EJECUTADO POR (Especialista que configura la cuenta de usuario y los
          servicios)
        </SignatureBox>
      </div>

      {/* SECCIÓN INFERIOR DE BAJA */}
      <div className="mt-1 flex border border-t-0 border-black">
        <div className="flex w-1/4 items-center border-r border-black p-0.75">
          <Check
            label="Baja de la entidad"
            checked={user.tipoSolicitud === "BAJA"}
          />
        </div>
        <div className="flex w-1/2 items-center border-r border-black p-0.75">
          <Label>Motivos de la baja:</Label>
          <Value>{user.motivosBaja || ""}</Value>
        </div>
        <div className="flex w-1/4 items-center p-0.75">
          <Label>Fecha:</Label>
          <Value>{formatDate(user.fechaBaja) || "__/__/20__"}</Value>
        </div>
      </div>

      {/* NOTA ACLARATORIA AL PIE */}
      <p className="mt-2 text-center text-[6.5px] italic">
        La presente planilla así como la cuenta de usuario asociada y los
        servicios implementados tiene una vigencia de dos (2) años a partir de
        su habilitación.
      </p>
    </div>
  );
}

/* ---------- Helper interno para fila con Si/No ---------- */

function CheckRow({ label, yes }: { label: string; yes: boolean }) {
  return (
    <div className="mb-0.5 flex items-center">
      <span className="w-22.5">{label}</span>
      <Check label="Si" checked={yes === true} />
      <Check label="No" checked={yes === false} />
    </div>
  );
}
