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
    <span className="mr-2 inline-flex items-center gap-1 whitespace-nowrap">
      <span className="inline-flex h-2.5 w-2.5 items-center justify-center border border-black text-[6px] leading-none">
        {checked ? "X" : ""}
      </span>
      {label ? <span className="text-[7.5px]">{label}</span> : null}
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
    <div className={`flex items-center px-1 py-0.5 ${width} ${className}`}>
      {children}
    </div>
  );
}

function Row({ children }: { children: ReactNode }) {
  return <div className="flex border-x border-b border-black">{children}</div>;
}

/* ---------- Fila de servicio con columna de motivo ---------- */

function ServiceSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex border-x border-b border-black">
      <div className="w-[55%] border-r border-black">
        <div className="border-b border-black px-1 py-0.5 text-[7.5px] font-bold">
          {title}
        </div>
        <div className="space-y-0.5 px-1 py-0.5">{children}</div>
      </div>
      <div className="flex w-[45%] flex-col">
        <div className="border-b border-black px-1 py-0.5 text-center text-[7.5px] font-bold">
          MOTIVO DE LA SOLICITUD
        </div>
        <div className="flex-1 px-1 py-0.5" />
      </div>
    </div>
  );
}

/* ---------- Filas de datos con líneas ---------- */

function DataFieldRow({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex border-x border-b border-black">
      <div className="flex items-center px-1 py-1">
        <Label>{label}</Label>
        <span className="ml-1 flex-1">{value || ""}</span>
      </div>
    </div>
  );
}

function DataFieldTwoCol({
  leftLabel,
  leftValue,
  rightLabel,
  rightValue,
}: {
  leftLabel: string;
  leftValue?: string | null;
  rightLabel: string;
  rightValue?: string | null;
}) {
  return (
    <div className="flex border-x border-b border-black">
      <div className="w-1/2 border-r border-black px-1 py-1">
        <Label>{leftLabel}</Label>
        <span className="ml-1 border-b">{leftValue || ""}</span>
      </div>
      <div className="w-1/2 px-1 py-1">
        <Label>{rightLabel}</Label>
        <span className="ml-1">{rightValue || ""}</span>
      </div>
    </div>
  );
}

/* ---------- Firmas ---------- */

function SignatureBox({ title, cargo }: { title: string; cargo?: string }) {
  return (
    <div className="flex h-12 flex-col border border-t-0 border-black">
      <div className="border-b border-black px-1 py-0.5 text-[7.5px] font-bold">
        {title}
      </div>
      <div className="flex flex-1">
        <div className="w-[25%] border-r border-black px-1 py-0.5">
          <div className="text-[6.5px]">Nombre y apellidos</div>
          <div className="mt-auto border-b border-black" />
        </div>
        <div className="w-[30%] border-r border-black px-1 py-0.5">
          <div className="text-[6.5px]">Cargo: {cargo || ""}</div>
          <div className="mt-auto border-b border-black" />
        </div>
        <div className="flex w-[20%] items-center gap-2 border-r border-black px-1 py-0.5">
          <div className="text-[6.5px]">Fecha:</div>
          <div className="text-[6.5px]">___/___/202_</div>
        </div>
        <div className="w-[25%] px-1 py-0.5">
          <div className="text-[6.5px]">Firma</div>
          <div className="mt-auto border-b border-black" />
        </div>
      </div>
    </div>
  );
}

/* ---------- Documento ---------- */

export default function UserAccountDocument({ user }: Props) {
  return (
    <div
      className="font-sans text-[8px] leading-tight text-black"
      style={{
        fontSize: "7.5px",
        lineHeight: "1.1",
        height: "255mm",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* TÍTULO CENTRADO */}
      <div className="mb-0.5 text-center text-[9px] font-bold">
        ANEXO XXXX-1 A1: SOLICITUD DE CUENTA DE USUARIO Y GESTIÓN DE ACCESOS
      </div>

      {/* ENCABEZADO SUPERIOR - TABLA */}
      <div className="mb-0.5 border border-black">
        {/* Fila 1: Código y título */}
        <div className="flex border-b border-black">
          <div className="w-[20%] border-r border-black px-1 py-0.5 text-[7.5px] font-bold">
            UD-PG 0074-A1.1
          </div>
          <div className="flex-1 px-1 py-0.5 text-center text-[8px] font-bold">
            SOLICITUD DE CUENTA DE USUARIO Y SERVICIOS DE RED
          </div>
        </div>
        {/* Fila 2: Folio y fecha */}
        <div className="flex border-b border-black">
          <div className="w-[50%] border-r border-black px-1 py-0.5 text-[7.5px]">
            <Label>Folio Único:</Label>
            <span className="ml-1">{user.folio || ""}</span>
          </div>
          <div className="w-[50%] px-1 py-0.5 text-[7.5px]">
            <Label>Fecha de Solicitud:</Label>
            <span className="ml-1 border-b border-black">
              {formatDate(user.createdAt) || "___/___/202_"}
            </span>
          </div>
        </div>
        {/* Fila 3: Tipo de gestión */}
        <div className="flex">
          <div className="w-[20%] border-r border-black px-1 py-0.5 text-[7.5px] font-bold">
            TIPO DE GESTIÓN:
          </div>
          <div className="flex flex-1">
            <div className="flex flex-1 items-center justify-center gap-2 border-r border-black px-1 py-0.5 text-[7.5px]">
              <span className="font-bold">ALTA</span>
              <Check checked={user.tipoSolicitud === "ALTA"} />
            </div>
            <div className="flex flex-1 items-center justify-center gap-2 border-r border-black px-1 py-0.5 text-[7.5px]">
              <span className="font-bold">ACTUALIZACIÓN</span>
              <Check checked={user.tipoSolicitud === "ACTUALIZACION"} />
            </div>
            <div className="flex flex-1 items-center justify-center gap-2 px-1 py-0.5 text-[7.5px]">
              <span className="font-bold">MODIFICACIÓN</span>
              <Check checked={false} />
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN 1: DATOS GENERALES */}
      <DataFieldRow label="Nombre y apellidos:" value={user.nombreApellidos} />
      <DataFieldRow
        label="Teléfono/Extensión:"
        value={user.telefonoExtension}
      />
      <DataFieldTwoCol
        leftLabel="Cargo:"
        leftValue={user.cargoOcupa}
        rightLabel="Departamento/Área:"
        rightValue={user.departamentoArea}
      />

      {/* Tipo de personal */}
      <div className="border-x border-b border-black">
        <div className="px-1 py-0.5">
          <Label>Tipo de personal:</Label>
        </div>
        <div className="flex flex-wrap border-t border-black px-1 py-0.5">
          <Check
            label="Directivo"
            checked={user.tipoPersonal === "DIRECTIVO"}
          />
          <Check
            label="Especialista principal (J. Grupo)"
            checked={user.tipoPersonal === "ESPECIALISTA_PRINCIPAL"}
          />
          <Check label="Técnico" checked={user.tipoPersonal === "TECNICO"} />
          <Check label="Otro" checked={user.tipoPersonal === "OTRO"} />
        </div>
      </div>

      <DataFieldRow
        label="Identificador de cuenta de usuario:"
        value={user.identificadorCuentaUsuario}
      />

      {/* SECCIÓN 2: SERVICIOS REQUERIDOS */}
      <div className="border-x border-b border-black px-1 py-0.5 text-center text-[8px] font-bold">
        SERVICIOS REQUERIDOS
      </div>

      {/* CORREO ELECTRÓNICO */}
      <ServiceSection title="CORREO ELECTRÓNICO">
        <CheckRow label="Correo Nacional:" yes={user.correoNacional} />
        <CheckRow
          label="Correo Internacional:"
          yes={user.correoInternacional}
        />
        <CheckRow label="Correo Internet:" yes={user.correoInternet} />
      </ServiceSection>

      {/* NAVEGACIÓN WEB */}
      <ServiceSection title="NAVEGACIÓN WEB">
        <CheckRow label="Intranet UNE:" yes={user.intranetUNE} />
        <CheckRow label="Intranet Nacional:" yes={user.intranetNacional} />
        <CheckRow label="Internet:" yes={user.internet} />
      </ServiceSection>

      {/* MENSAJERÍA INSTANTÁNEA / CHAT */}
      <ServiceSection title="MENSAJERÍA INSTANTÁNEA / CHAT">
        <CheckRow label="Corporativa:" yes={user.mensajeriaCorporativa} />
      </ServiceSection>

      {/* REDES SOCIALES */}
      <ServiceSection title="REDES SOCIALES">
        <div className="flex flex-wrap gap-2">
          <Check label="Facebook" checked={user.facebook} />
          <Check label="Twitter" checked={user.twitter} />
          <Check label="YouTube" checked={user.youtube} />
          <Check label="WhatsApp" checked={user.whatsapp} />
          <Check label="Telegram" checked={user.telegram} />
          <Check label="Instagram" checked={user.instagram} />
        </div>
        <div className="mt-0.5">
          <Label>Otras:</Label>{" "}
          <span className="border-b border-black">{user.otrasRedes || ""}</span>
        </div>
      </ServiceSection>

      {/* PRIVILEGIOS DE USUARIO */}
      <ServiceSection title="PRIVILEGIOS DE USUARIO SOBRE LA RED Y EL ORDENADOR">
        <CheckRow label="Usuario:" yes={user.usuario} />
        <CheckRow label="Usuario Avanzado:" yes={user.usuarioAvanzado} />
        <CheckRow label="Administrador Local:" yes={user.adminLocal} />
        <CheckRow label="Administrador de Red:" yes={user.adminRed} />
      </ServiceSection>

      {/* ACCESO NUBE UNE */}
      <ServiceSection title="ACCESO NUBE UNE">
        <div className="flex flex-wrap gap-x-3">
          <Check label="Solo lectura" checked={user.accesoNubeLectura} />
          <Check label="Modificar" checked={user.accesoNubeModificar} />
          <Check label="Borrar" checked={user.accesoNubeBorrar} />
        </div>
        <Check label="Control total" checked={user.accesoNubeControlTotal} />
      </ServiceSection>

      {/* TIPO DE CUENTA */}
      <div className="border-x border-b border-black px-1 py-0.5 text-center text-[8px] font-bold">
        TIPO DE CUENTA
      </div>

      <Row>
        <Cell width="w-full">
          <Check
            label="Permanente"
            checked={user.tipoCuenta === "PERMANENTE"}
          />
          <span className="ml-1 text-[7px]">
            Válida por 2 años a partir de su creación o actualización.
          </span>
        </Cell>
      </Row>

      <Row>
        <Cell width="w-full">
          <Check label="Temporal" checked={user.tipoCuenta === "TEMPORAL"} />
          <span className="ml-1 text-[7px]">
            Fecha de expiración{" "}
            <span className="">
              {formatDate(user.fechaExpiracion) || "___/___/202_"}
            </span>
          </span>
        </Cell>
      </Row>

      {/* DÍAS Y HORAS DE USO DE LA CUENTA */}
      <div className="border-x border-b border-black px-1 py-0.5 text-center text-[8px] font-bold">
        DÍAS Y HORAS DE USO DE LA CUENTA:
      </div>

      <Row>
        <Cell width="w-full">
          <Check
            label="Lunes a Viernes"
            checked={!user.horarioExtralaboral && !user.horario24Horas}
          />
          <Check
            label="Horario Extralaboral"
            checked={user.horarioExtralaboral}
          />
          {!user.horario24Horas && (
            <span>
              de
              <span className="border-b border-black">
                {user.extraDesde || ""}
              </span>{" "}
              hrs. a{" "}
              <span className="border-b border-black">
                {user.extraHasta || ""}
              </span>{" "}
              hrs.
            </span>
          )}
        </Cell>
      </Row>

      <Row>
        <Cell width="w-full">
          <span className="mr-1">No laborables:</span>
          <span>
            Sábado de{" "}
            <span className="border-b border-black">
              {user.sabadoDesde || ""}
            </span>{" "}
            hrs. a{" "}
            <span className="border-b border-black">
              {user.sabadoHasta || ""}
            </span>{" "}
            hrs.
          </span>
          <span className="ml-2">
            Domingo de{" "}
            <span className="border-b border-black">
              {user.domingoDesde || ""}
            </span>{" "}
            hrs. a{" "}
            <span className="border-b border-black">
              {user.domingoHasta || ""}
            </span>{" "}
            hrs.
          </span>
          <span className="ml-4">
            <Check label="24 horas" checked={user.horario24Horas} />
          </span>
        </Cell>
      </Row>

      {/* ACCESO POR APN */}
      <div className="border-x border-b border-black px-1 py-0.5 text-center text-[8px] font-bold">
        ACCESO POR APN
      </div>

      <Row>
        <Cell width="w-full">
          <Check label="Correo nacional" checked={user.apnCorreoNacional} />
          <Check
            label="Correo Internacional"
            checked={user.apnCorreoInternacional}
          />
          <Check label="Internet" checked={user.apnInternet} />
          <Label>Número celular:</Label>
          <span className="ml-1">{user.telefonoCelular || ""}</span>
        </Cell>
      </Row>

      {/* MEDIO INFORMÁTICO */}
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
        <Cell width="w-1/2" className="h-6 border-r border-black">
          <Value>{user.pcNombre || ""}</Value>
        </Cell>
        <Cell width="w-1/2" className="h-6">
          <Value>{user.pcAdicionalNombre || ""}</Value>
        </Cell>
      </Row>

      {/* SOFTWARE */}
      <Row>
        <Cell width="w-full" className="h-5">
          <Label>
            Software autorizado (Además del autorizado por política):
          </Label>
          <Value>{user.softwareAutorizado || ""}</Value>
        </Cell>
      </Row>

      {/* SECCIÓN 3: CUADROS DE FIRMAS */}
      <div className="mt-0.5 flex flex-col">
        <SignatureBox title="SOLICITADO POR EL DIRECTOR QUE SOLICITA EL SERVICIO. (Este responde por los servicios solicitados)" />
        <SignatureBox title="REVISADO POR:" />
        <SignatureBox title="APROBADO POR (Director que autoriza el servicio o persona designada por Resolución del Director General de la Entidad)" />
        <SignatureBox title="EJECUTADO POR (Especialista que configura la cuenta de usuario y los servicios)" />
      </div>

      {/* SECCIÓN INFERIOR DE BAJA */}
      <div className="flex border border-t-0 border-black">
        <div className="flex w-1/4 items-center border-r border-black px-1 py-1">
          <Check
            label="Baja de la entidad"
            checked={user.tipoSolicitud === "BAJA"}
          />
        </div>
        <div className="flex w-1/2 items-center border-r border-black px-1 py-1">
          <Label>Motivos</Label>
        </div>
        <div className="flex w-1/4 items-center px-1 py-1">
          <Label>Fecha</Label>
          <span className="ml-1">
            {formatDate(user.fechaBaja) || "___/___/202_"}
          </span>
        </div>
      </div>

      {/* NOTA ACLARATORIA AL PIE */}
      <p className="mt-1 text-center text-[7.5px]">
        La presente planilla, así como la cuenta de usuario asociada y los
        servicios autorizados e implementados tienen una vigencia de dos (2)
        años a partir de su habilitación.
      </p>
    </div>
  );
}

/* ---------- Helper interno para fila con Si/No ---------- */

function CheckRow({ label, yes }: { label: string; yes: boolean }) {
  return (
    <div className="mb-0.5 flex items-center">
      <span className="w-28 text-[7.5px]">{label}</span>
      <Check label="Si" checked={yes === true} />
      <Check label="No" checked={yes === false} />
    </div>
  );
}
