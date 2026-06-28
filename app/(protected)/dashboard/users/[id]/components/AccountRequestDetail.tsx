"use client";

import { AccountRequest } from "@/generated/prisma/client";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFViewer,
} from "@react-pdf/renderer";

interface Props {
  user: AccountRequest;
}

// Estilos de la planilla basados exactamente en el diseño original de la imagen
const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontSize: 7.5,
    fontFamily: "Helvetica",
    color: "#000",
  },
  // Título Principal y Encabezado superior
  headerTable: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#000",
    marginBottom: 4,
  },
  headerTitle: {
    width: "60%",
    padding: 6,
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
  },
  headerOptions: {
    width: "40%",
    flexDirection: "row",
    borderLeftWidth: 1,
    borderColor: "#000",
  },
  headerOptCell: {
    flex: 1,
    borderRightWidth: 1,
    borderColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    padding: 2,
    fontSize: 6.5,
  },

  // Estructura general de tablas/filas
  sectionTitleRow: {
    backgroundColor: "#e0e0e0",
    borderWidth: 1,
    borderColor: "#000",
    borderBottomWidth: 0,
    padding: 3,
    fontFamily: "Helvetica-Bold",
  },
  row: {
    flexDirection: "row",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#000",
  },
  cell: {
    padding: 3,
    flexDirection: "row",
    alignItems: "center",
  },
  cellLabel: {
    fontFamily: "Helvetica-Bold",
    marginRight: 3,
  },
  cellValue: {
    flex: 1,
  },

  // Sub-bloques de Servicios Requeridos
  subHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#f2f2f2",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#000",
    fontFamily: "Helvetica-Bold",
  },
  colServicios: { width: "45%", padding: 3 },
  colMotivo: {
    width: "55%",
    padding: 3,
    borderLeftWidth: 1,
    borderColor: "#000",
  },

  // Casillas de selección (Checkboxes simulados)
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 6,
  },
  checkboxSquare: {
    width: 11,
    height: 11,
    borderWidth: 1,
    borderColor: "#000",
    marginRight: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
  },

  // Sección de Firmas (Píe de página)
  signatureGrid: {
    marginTop: 5,
  },
  signatureBox: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#000",
    marginBottom: -1,
  },
  signatureHeader: {
    backgroundColor: "#e0e0e0",
    padding: 2,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    borderBottomWidth: 1,
    borderColor: "#000",
  },
  signatureRow: {
    flexDirection: "row",
    height: 32,
  },
  signatureCell: {
    flex: 1,
    padding: 3,
    borderRightWidth: 1,
    borderColor: "#000",
  },
  footerText: {
    fontSize: 6.5,
    textAlign: "center",
    marginTop: 8,
    fontFamily: "Helvetica-Oblique",
  },
});

// Componente interno para renderizar casillas de verificación
const CheckBox = ({ label, checked }: { label?: string; checked: boolean }) => (
  <View style={styles.checkboxContainer}>
    <View style={styles.checkboxSquare}>
      {checked && <Text style={styles.checkboxText}>X</Text>}
    </View>
    {label ? <Text>{label}</Text> : null}
  </View>
);

const formatDate = (date: Date | null | undefined): string => {
  if (!date) return "";
  return date.toLocaleDateString();
};

export default function PlanillaUsuarioPDF({ user }: Props) {
  return (
    <PDFViewer style={{ width: "100%", height: "100vh" }}>
      <Document>
        <Page size="A4" style={styles.page}>
          {/* ENCABEZADO SUPERIOR DE TRÁMITE */}
          <View style={styles.headerTable}>
            <Text style={styles.headerTitle}>
              ANEXO OM-PP 0001. A1 Solicitud de cuenta de usuario y servicios de
              red
            </Text>
            <View style={styles.headerOptions}>
              <View style={styles.headerOptCell}>
                <Text style={{ fontFamily: "Helvetica-Bold" }}>ALTA</Text>
                <CheckBox checked={user.tipoSolicitud === "ALTA"} />
              </View>
              <View style={styles.headerOptCell}>
                <Text style={{ fontFamily: "Helvetica-Bold" }}>
                  ACTUALIZACIÓN
                </Text>
                <CheckBox checked={user.tipoSolicitud === "ACTUALIZACION"} />
              </View>
              <View style={styles.headerOptCell}>
                <Text style={{ fontFamily: "Helvetica-Bold" }}>
                  MODIFICACIÓN
                </Text>
                <CheckBox checked={user.tipoSolicitud === "MODIFICACION"} />
              </View>
              <View style={[styles.headerOptCell, { borderRightWidth: 0 }]}>
                <Text style={{ fontFamily: "Helvetica-Bold" }}>FOLIO</Text>
                <Text style={{ marginTop: 2 }}>{user.folio || ""}</Text>
              </View>
            </View>
          </View>

          {/* SECCIÓN 1: DATOS GENERALES */}
          <View style={styles.sectionTitleRow}>
            <Text>SOLICITUD DE CUENTA DE USUARIO Y SERVICIOS DE RED</Text>
          </View>

          <View style={styles.row}>
            <View
              style={[
                styles.cell,
                { width: "50%", borderRightWidth: 1, borderColor: "#000" },
              ]}
            >
              <Text style={styles.cellLabel}>Nombre y apellidos:</Text>
              <Text style={styles.cellValue}>{user.nombreApellidos || ""}</Text>
            </View>
            <View style={[styles.cell, { width: "50%" }]}>
              <Text style={styles.cellLabel}>Departamento/Área:</Text>
              <Text style={styles.cellValue}>
                {user.departamentoArea || ""}
              </Text>
            </View>
          </View>

          <View style={styles.row}>
            <View
              style={[
                styles.cell,
                { width: "50%", borderRightWidth: 1, borderColor: "#000" },
              ]}
            >
              <Text style={styles.cellLabel}>Cargo que ocupa:</Text>
              <Text style={styles.cellValue}>{user.cargoOcupa || ""}</Text>
            </View>
            <View style={[styles.cell, { width: "50%" }]}>
              <Text style={styles.cellLabel}>Cuenta:</Text>
              <Text style={styles.cellValue}>{user.cuenta || ""}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.cell, { width: "100%" }]}>
              <Text style={styles.cellLabel}>Tipo de personal:</Text>
              <CheckBox
                label="Directivo."
                checked={user.tipoPersonal === "DIRECTIVO"}
              />
              <CheckBox
                label="Especialista principal (J. Grupo)"
                checked={user.tipoPersonal === "ESPECIALISTA_PRINCIPAL"}
              />
              <CheckBox
                label="Técnico"
                checked={user.tipoPersonal === "TECNICO"}
              />
              <CheckBox label="Otro" checked={user.tipoPersonal === "OTRO"} />
            </View>
          </View>

          {/* SECCIÓN 2: MATRIZ DE SERVICIOS REQUERIDOS */}
          <View style={styles.subHeaderRow}>
            <Text style={styles.colServicios}>Servicios requeridos:</Text>
            <Text style={styles.colMotivo}>MOTIVO DE LA SOLICITUD</Text>
          </View>

          {/* BLOQUE: CORREO ELECTRÓNICO */}
          <View style={styles.row}>
            <View style={styles.colServicios}>
              <Text style={{ fontFamily: "Helvetica-Bold", marginBottom: 2 }}>
                CORREO ELECTRONICO
              </Text>
              <View style={{ flexDirection: "row", marginBottom: 2 }}>
                <Text style={{ width: 90 }}>Correo Local:</Text>
                <CheckBox label="Si" checked={user.correoLocal === true} />
                <CheckBox label="No" checked={user.correoLocal === false} />
              </View>
              <View style={{ flexDirection: "row", marginBottom: 2 }}>
                <Text style={{ width: 90 }}>Correo Nacional:</Text>
                <CheckBox label="Si" checked={user.correoNacional === true} />
                <CheckBox label="No" checked={user.correoNacional === false} />
              </View>
              <View style={{ flexDirection: "row", marginBottom: 2 }}>
                <Text style={{ width: 90 }}>Correo Internacional:</Text>
                <CheckBox
                  label="Si"
                  checked={user.correoInternacional === true}
                />
                <CheckBox
                  label="No"
                  checked={user.correoInternacional === false}
                />
              </View>
              <View style={{ flexDirection: "row" }}>
                <Text style={{ width: 90 }}>Correo Internet:</Text>
                <CheckBox label="Si" checked={user.correoInternet === true} />
                <CheckBox label="No" checked={user.correoInternet === false} />
                <Text style={{ fontSize: 6 }}>No. Temp. ___/___/20__</Text>
              </View>
            </View>
            <View style={styles.colMotivo}>
              <Text style={{ marginBottom: 5 }}></Text>
              <Text style={{ marginBottom: 5 }}></Text>
            </View>
          </View>

          {/* BLOQUE: ACCESO A NAVEGACIÓN WEB */}
          <View style={styles.row}>
            <View style={styles.colServicios}>
              <Text
                style={{ fontFamily: "Helvetica-Bold", marginBottom: 2 }}
              ></Text>
              <View style={{ flexDirection: "row", marginBottom: 2 }}>
                <Text style={{ width: 90 }}>Intranet UNE:</Text>
                <CheckBox label="Si" checked={user.intranetUNE === true} />
                <CheckBox label="No" checked={user.intranetUNE === false} />
              </View>
              <View style={{ flexDirection: "row", marginBottom: 2 }}>
                <Text style={{ width: 90 }}>Intranet Nacional:</Text>
                <CheckBox label="Si" checked={user.intranetNacional === true} />
                <CheckBox
                  label="No"
                  checked={user.intranetNacional === false}
                />
              </View>
              <View style={{ flexDirection: "row" }}>
                <Text style={{ width: 90 }}>Internet:</Text>
                <CheckBox label="Si" checked={user.internet === true} />
                <CheckBox label="No" checked={user.internet === false} />
                <Text style={{ fontSize: 6 }}>No. Temp. ___/___/20__</Text>
              </View>
            </View>
            <View style={styles.colMotivo}>
              <Text style={{ marginBottom: 10 }}></Text>
              <Text></Text>
            </View>
          </View>

          {/* BLOQUE: MENSAJERÍA INSTANTÁNEA / CHAT */}
          <View style={styles.row}>
            <View style={styles.colServicios}>
              <Text style={{ fontFamily: "Helvetica-Bold", marginBottom: 2 }}>
                Mensajería Instantánea / Chat
              </Text>
              <View style={{ flexDirection: "row", marginBottom: 2 }}>
                <Text style={{ width: 90 }}>Corporativa:</Text>
                <CheckBox
                  label="Si"
                  checked={user.mensajeriaCorporativa === true}
                />
                <CheckBox
                  label="No"
                  checked={user.mensajeriaCorporativa === false}
                />
              </View>
              <View style={{ flexDirection: "row" }}>
                <Text style={{ width: 90 }}>Chat Internet:</Text>
                <CheckBox label="Si" checked={user.chatInternet === true} />
                <CheckBox label="No" checked={user.chatInternet === false} />
                <Text style={{ fontSize: 6 }}>No. Temp. ___/___/20__</Text>
              </View>
            </View>
            <View style={styles.colMotivo}>
              <Text></Text>
            </View>
          </View>

          {/* BLOQUE: REDES SOCIALES */}
          <View style={styles.row}>
            <View style={styles.colServicios}>
              <Text style={{ fontFamily: "Helvetica-Bold", marginBottom: 2 }}>
                Redes Sociales
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                <CheckBox label="Facebook" checked={user.facebook} />
                <CheckBox label="Twitter" checked={user.twitter} />
                <CheckBox label="YouTube" checked={user.youtube} />
                <CheckBox label="Otro" checked={!!user.otrasRedes} />
              </View>
            </View>
            <View style={styles.colMotivo}>
              <Text></Text>
            </View>
          </View>

          {/* BLOQUE: OTRAS Y PRIVILEGIOS */}
          <View style={styles.row}>
            <View
              style={[
                styles.cell,
                { width: "45%", borderRightWidth: 1, borderColor: "#000" },
              ]}
            >
              <Text style={styles.cellLabel}>Otras: Especificar:</Text>
              <Text>{user.otrasRedes || ""}</Text>
            </View>
            <View style={[styles.cell, { width: "55%" }]}>
              <Text style={styles.cellLabel}>
                Privilegios de usuario sobre la red y el ordenador:
              </Text>
            </View>
          </View>

          <View style={styles.row}>
            <View
              style={[
                styles.cell,
                { width: "45%", borderRightWidth: 1, borderColor: "#000" },
              ]}
            />
            <View style={[styles.cell, { width: "55%" }]}>
              <CheckBox
                label="Administrador de Red"
                checked={user.adminRed === true}
              />
              <CheckBox label="No" checked={user.adminRed === false} />
            </View>
          </View>
          <View style={styles.row}>
            <View
              style={[
                styles.cell,
                { width: "45%", borderRightWidth: 1, borderColor: "#000" },
              ]}
            />
            <View style={[styles.cell, { width: "55%" }]}>
              <CheckBox
                label="Administrador Local"
                checked={user.adminLocal === true}
              />
              <CheckBox label="No" checked={user.adminLocal === false} />
            </View>
          </View>
          <View style={styles.row}>
            <View
              style={[
                styles.cell,
                { width: "45%", borderRightWidth: 1, borderColor: "#000" },
              ]}
            />
            <View style={[styles.cell, { width: "55%" }]}>
              <CheckBox
                label="Usuario avanzado"
                checked={user.usuarioAvanzado === true}
              />
              <CheckBox label="No" checked={user.usuarioAvanzado === false} />
            </View>
          </View>

          {/* COMPARTIMENTOS FTP */}
          <View style={styles.row}>
            <View
              style={[
                styles.cell,
                { width: "50%", borderRightWidth: 1, borderColor: "#000" },
              ]}
            >
              <Text style={styles.cellLabel}>Acceso FTP UNE</Text>
              <CheckBox label="Solo Lectura" checked={user.ftpUneLectura} />
              <CheckBox label="Modificar" checked={user.ftpUneModificar} />
              <CheckBox label="Borrar" checked={user.ftpUneBorrar} />
            </View>
            <View style={[styles.cell, { width: "50%" }]}>
              <Text style={styles.cellLabel}>Acceso FTP Entidad</Text>
              <CheckBox label="Solo Lectura" checked={user.ftpEntidadLectura} />
              <CheckBox label="Modificar" checked={user.ftpEntidadModificar} />
              <CheckBox label="Borrar" checked={user.ftpEntidadBorrar} />
            </View>
          </View>

          {/* RESTRICCIONES DE TIEMPO Y EXPIRACIÓN */}
          <View style={styles.row}>
            <View
              style={[
                styles.cell,
                { width: "40%", borderRightWidth: 1, borderColor: "#000" },
              ]}
            >
              <Text style={styles.cellLabel}>Tipo de cuenta:</Text>
              <CheckBox
                label="Permanente"
                checked={user.tipoCuenta === "PERMANENTE"}
              />
              <CheckBox
                label="Temporal"
                checked={user.tipoCuenta === "TEMPORAL"}
              />
            </View>
            <View style={[styles.cell, { width: "60%" }]}>
              <Text style={styles.cellLabel}>
                En caso de cuenta temporal: Fecha de expiración:
              </Text>
              <Text>{formatDate(user.fechaExpiracion) || "__/__/20__"}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.cell, { width: "100%" }]}>
              <Text style={styles.cellLabel}>
                Días y horas de uso de la cuenta:
              </Text>
              <CheckBox
                label="Lunes a Viernes"
                checked={!user.horarioExtralaboral}
              />
              <CheckBox
                label="Horario Extralaboral"
                checked={user.horarioExtralaboral === true}
              />
              <Text>
                De {user.extraDesde || "__"} hrs a {user.extraHasta || "__"}{" "}
                hrs.
              </Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.cell, { width: "100%" }]}>
              <Text style={styles.cellLabel}>No laborables:</Text>
              <CheckBox label="Sábado" checked={!!user.sabadoDesde} />
              <Text>
                De {user.sabadoDesde || "__"} hrs a {user.sabadoHasta || "__"}{" "}
                hrs.
              </Text>
              <CheckBox label="Domingo" checked={!!user.domingoDesde} />
              <Text>
                De {user.domingoDesde || "__"} hrs a {user.domingoHasta || "__"}{" "}
                hrs.
              </Text>
            </View>
          </View>

          {/* ASIGNACIONES TECNOLÓGICAS (APN / PC / SOFTWARE) */}
          <View style={styles.row}>
            <View style={[styles.cell, { width: "100%" }]}>
              <Text style={styles.cellLabel}>Acceso por APN:</Text>
              <CheckBox
                label="Correo nacional"
                checked={user.apnCorreoNacional}
              />
              <CheckBox
                label="Correo internacional"
                checked={user.apnCorreoInternacional}
              />
              <CheckBox label="Internet" checked={user.apnInternet} />
              <Text style={styles.cellLabel}> Número teléfono celular:</Text>
              <Text>{user.telefonoCelular || "________________"}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View
              style={[
                styles.cell,
                { width: "50%", borderRightWidth: 1, borderColor: "#000" },
              ]}
            >
              <Text style={styles.cellLabel}>
                Se autoriza a utilizar el siguiente medio Informático (Nombre
                PC)
              </Text>
            </View>
            <View style={[styles.cell, { width: "50%" }]}>
              <Text style={styles.cellLabel}>
                Se autoriza además a autenticarse en los siguientes PC (Nombre
                PC)
              </Text>
            </View>
          </View>

          <View style={styles.row}>
            <View
              style={[
                styles.cell,
                {
                  width: "50%",
                  borderRightWidth: 1,
                  borderColor: "#000",
                  height: 14,
                },
              ]}
            >
              <Text>{user.pcNombre || ""}</Text>
            </View>
            <View style={[styles.cell, { width: "50%", height: 14 }]}>
              <Text>{user.pcAdicionalNombre || ""}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View
              style={[
                styles.cell,
                { width: "50%", borderRightWidth: 1, borderColor: "#000" },
              ]}
            >
              <Text style={styles.cellLabel}>No. Inventario:</Text>
              <Text>{user.pcInventario || ""}</Text>
            </View>
            <View style={[styles.cell, { width: "50%" }]}>
              <Text style={styles.cellLabel}>No. Inventario:</Text>
              <Text>{user.pcAdicionalInventario || ""}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.cell, { width: "100%" }]}>
              <Text style={styles.cellLabel}>
                Software autorizado (Además del autorizado por política):
              </Text>
              <Text>{user.softwareAutorizado || ""}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View
              style={[
                styles.cell,
                { width: "35%", borderRightWidth: 1, borderColor: "#000" },
              ]}
            >
              <Text style={styles.cellLabel}>Cuenta de Usuario:</Text>
              <Text>{user.cuentaUsuario || ""}</Text>
            </View>
            <View
              style={[
                styles.cell,
                { width: "40%", borderRightWidth: 1, borderColor: "#000" },
              ]}
            >
              <Text style={styles.cellLabel}>Actividad que realiza:</Text>
              <Text>{user.actividadRealiza || ""}</Text>
            </View>
            <View style={[styles.cell, { width: "25%" }]}>
              <Text style={styles.cellLabel}>Administrador de Sistema:</Text>
              <CheckBox
                label="Si"
                checked={user.administradorSistema === true}
              />
              <CheckBox
                label="No"
                checked={user.administradorSistema === false}
              />
            </View>
          </View>

          {/* SECCIÓN 3: CUADROS DE REVISIÓN Y FIRMAS */}
          <View style={styles.signatureGrid}>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureHeader}>
                SOLICITADO POR EL DIRECTOR QUE SOLICITA EL SERVICIO. (Este
                responde por los servicios solicitados)
              </Text>
              <View style={styles.signatureRow}>
                <View style={[styles.signatureCell, { width: "40%" }]}>
                  <Text style={styles.cellLabel}>Nombre y apellidos:</Text>
                  <Text>{user.solicitadoNombre || ""}</Text>
                </View>
                <View style={[styles.signatureCell, { width: "30%" }]}>
                  <Text style={styles.cellLabel}>Cargo:</Text>
                  <Text>{user.solicitadoCargo || ""}</Text>
                </View>
                <View style={[styles.signatureCell, { width: "15%" }]}>
                  <Text style={styles.cellLabel}>Fecha:</Text>
                  <Text>{formatDate(user.solicitadoFecha) || ""}</Text>
                </View>
                <View
                  style={[
                    styles.signatureCell,
                    { width: "15%", borderRightWidth: 0 },
                  ]}
                >
                  <Text style={styles.cellLabel}>Firma:</Text>
                </View>
              </View>
            </View>

            <View style={styles.signatureBox}>
              <Text style={styles.signatureHeader}>
                REVISADO POR: (Esp. Seguridad Informática y Tecnológica)
              </Text>
              <View style={styles.signatureRow}>
                <View style={[styles.signatureCell, { width: "40%" }]}>
                  <Text style={styles.cellLabel}>Nombre y apellidos:</Text>
                  <Text>{user.revisadoNombre || ""}</Text>
                </View>
                <View style={[styles.signatureCell, { width: "30%" }]}>
                  <Text style={styles.cellLabel}>Cargo:</Text>
                  <Text>{user.revisadoCargo || ""}</Text>
                </View>
                <View style={[styles.signatureCell, { width: "15%" }]}>
                  <Text style={styles.cellLabel}>Fecha:</Text>
                  <Text>{formatDate(user.revisadoFecha) || ""}</Text>
                </View>
                <View
                  style={[
                    styles.signatureCell,
                    { width: "15%", borderRightWidth: 0 },
                  ]}
                >
                  <Text style={styles.cellLabel}>Firma:</Text>
                </View>
              </View>
            </View>

            <View style={styles.signatureBox}>
              <Text style={styles.signatureHeader}>
                APROBADO POR (Director que autoriza el servicio o persona
                designada por Resolución del Director General de la Entidad)
              </Text>
              <View style={styles.signatureRow}>
                <View style={[styles.signatureCell, { width: "40%" }]}>
                  <Text style={styles.cellLabel}>Nombre y apellidos:</Text>
                  <Text>{user.aprobadoNombre || ""}</Text>
                </View>
                <View style={[styles.signatureCell, { width: "30%" }]}>
                  <Text style={styles.cellLabel}>Cargo:</Text>
                  <Text>{user.aprobadoCargo || ""}</Text>
                </View>
                <View style={[styles.signatureCell, { width: "15%" }]}>
                  <Text style={styles.cellLabel}>Fecha:</Text>
                  <Text>{formatDate(user.aprobadoFecha) || ""}</Text>
                </View>
                <View
                  style={[
                    styles.signatureCell,
                    { width: "15%", borderRightWidth: 0 },
                  ]}
                >
                  <Text style={styles.cellLabel}>Firma:</Text>
                </View>
              </View>
            </View>

            <View style={styles.signatureBox}>
              <Text style={styles.signatureHeader}>
                EJECUTADO POR (Especialista que configura la cuenta de usuario y
                los servicios)
              </Text>
              <View style={styles.signatureRow}>
                <View style={[styles.signatureCell, { width: "40%" }]}>
                  <Text style={styles.cellLabel}>Nombre y apellidos:</Text>
                  <Text>{user.ejecutadoNombre || ""}</Text>
                </View>
                <View style={[styles.signatureCell, { width: "30%" }]}>
                  <Text style={styles.cellLabel}>Cargo:</Text>
                  <Text>{user.ejecutadoCargo || ""}</Text>
                </View>
                <View style={[styles.signatureCell, { width: "15%" }]}>
                  <Text style={styles.cellLabel}>Fecha:</Text>
                  <Text>{formatDate(user.ejecutadoFecha) || ""}</Text>
                </View>
                <View
                  style={[
                    styles.signatureCell,
                    { width: "15%", borderRightWidth: 0 },
                  ]}
                >
                  <Text style={styles.cellLabel}>Firma:</Text>
                </View>
              </View>
            </View>
          </View>

          {/* SECCIÓN INFERIOR DE BAJA */}
          <View style={[styles.row, { marginTop: 4, borderTopWidth: 1 }]}>
            <View
              style={[
                styles.cell,
                { width: "25%", borderRightWidth: 1, borderColor: "#000" },
              ]}
            >
              <CheckBox
                label="Baja de la entidad"
                checked={user.bajaEntidad === true}
              />
            </View>
            <View
              style={[
                styles.cell,
                { width: "50%", borderRightWidth: 1, borderColor: "#000" },
              ]}
            >
              <Text style={styles.cellLabel}>Motivos de la baja:</Text>
              <Text>{user.motivosBaja || ""}</Text>
            </View>
            <View style={[styles.cell, { width: "25%" }]}>
              <Text style={styles.cellLabel}>Fecha:</Text>
              <Text>{formatDate(user.fechaBaja) || "__/__/20__"}</Text>
            </View>
          </View>

          {/* NOTA ACLARATORIA AL PIE */}
          <Text style={styles.footerText}>
            La presente planilla así como la cuenta de usuario asociada y los
            servicios implementados tiene una vigencia de dos (2) años a partir
            de su habilitación.
          </Text>
        </Page>
      </Document>
    </PDFViewer>
  );
}
