"use client";

import { useActionState, useState } from "react";
import Field from "@/components/field";
import SelectField from "@/components/select-field";
import CheckboxField from "@/components/checkbox-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createUserAccountAction } from "../actions/create-user-account-action";
import type { CreateUserAccountState } from "@/lib/types";
import {
  ACCOUNT_OPTIONS,
  PERSONAL_OPTIONS,
  REQUEST_OPTIONS,
} from "@/lib/constants";

interface Props {
  mode?: "create" | "edit";
  id?: string;
  initialData?: CreateUserAccountState["data"];
  action?: typeof createUserAccountAction;
}

export default function UserAccountForm({
  mode = "create",
  id,
  initialData,
  action = createUserAccountAction,
}: Props) {
  const initialState: CreateUserAccountState = {
    data: initialData,
    success: false,
    dbErrors: null,
    validationErrors: null,
  };
  const [state, formAction, pending] = useActionState(action, initialState);

  const [correoInternet, setCorreoInternet] = useState(
    !!initialData?.correoInternet,
  );
  const [internet, setInternet] = useState(!!initialData?.internet);
  const [chatInternet, setChatInternet] = useState(!!initialData?.chatInternet);
  const [tipoSolicitud, setTipoSolicitud] = useState(
    initialData?.tipoSolicitud ?? "",
  );
  const [tipoCuenta, setTipoCuenta] = useState(initialData?.tipoCuenta ?? "");
  const [horarioExtralaboral, setHorarioExtralaboral] = useState(
    !!initialData?.horarioExtralaboral,
  );

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">
        {mode === "edit"
          ? "Editar solicitud de cuenta"
          : "Crear solicitud de cuenta"}
      </h1>
      <form action={formAction} className="space-y-6">
        {mode === "edit" && id && <input type="hidden" name="id" value={id} />}
        <Card>
          <CardHeader>
            <CardTitle>Encabezado</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SelectField
              label="Tipo de solicitud"
              name="tipoSolicitud"
              options={REQUEST_OPTIONS}
              defaultValue={state.data?.tipoSolicitud}
              errors={state.validationErrors?.tipoSolicitud}
              onChange={setTipoSolicitud}
              disabledValues={
                mode === "create" ? ["BAJA", "ACTUALIZACION"] : ["ALTA", "BAJA"]
              }
            />
            {tipoSolicitud === "BAJA" && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field
                  label="Motivos de baja"
                  name="motivosBaja"
                  defaultValue={state.data?.motivosBaja}
                  errors={state.validationErrors?.motivosBaja}
                />
                <Field
                  label="Fecha de baja"
                  name="fechaBaja"
                  type="date"
                  defaultValue={state.data?.fechaBaja}
                  errors={state.validationErrors?.fechaBaja}
                />
              </div>
            )}
            <Field
              label="Folio"
              name="folio"
              defaultValue={state.data?.folio}
              errors={state.validationErrors?.folio}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Datos personales</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field
              label="Nombre y apellidos"
              name="nombreApellidos"
              defaultValue={state.data?.nombreApellidos}
              errors={state.validationErrors?.nombreApellidos}
            />
            <Field
              label="Cargo que ocupa"
              name="cargoOcupa"
              defaultValue={state.data?.cargoOcupa}
              errors={state.validationErrors?.cargoOcupa}
            />
            <Field
              label="Departamento / Área"
              name="departamentoArea"
              defaultValue={state.data?.departamentoArea}
              errors={state.validationErrors?.departamentoArea}
            />
            <SelectField
              label="Tipo de personal"
              name="tipoPersonal"
              options={PERSONAL_OPTIONS}
              defaultValue={state.data?.tipoPersonal}
              errors={state.validationErrors?.tipoPersonal}
            />
            <Field
              label="Cuenta"
              name="cuenta"
              defaultValue={state.data?.cuenta}
              errors={state.validationErrors?.cuenta}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Correo electrónico</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <CheckboxField
                label="Correo Local"
                name="correoLocal"
                defaultChecked={!!state.data?.correoLocal}
              />
              <CheckboxField
                label="Correo Nacional"
                name="correoNacional"
                defaultChecked={!!state.data?.correoNacional}
              />
              <CheckboxField
                label="Correo Internacional"
                name="correoInternacional"
                defaultChecked={!!state.data?.correoInternacional}
              />
              <CheckboxField
                label="Correo Internet"
                name="correoInternet"
                defaultChecked={!!state.data?.correoInternet}
                onChange={setCorreoInternet}
              />
            </div>
            {correoInternet && (
              <Field
                label="Fecha de expiración (Correo Internet)"
                name="correoInternetFechaTemp"
                type="date"
                defaultValue={state.data?.correoInternetFechaTemp}
                errors={state.validationErrors?.correoInternetFechaTemp}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Navegación web</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <CheckboxField
                label="Intranet UNE"
                name="intranetUNE"
                defaultChecked={!!state.data?.intranetUNE}
              />
              <CheckboxField
                label="Intranet Nacional"
                name="intranetNacional"
                defaultChecked={!!state.data?.intranetNacional}
              />
              <CheckboxField
                label="Internet"
                name="internet"
                defaultChecked={!!state.data?.internet}
                onChange={setInternet}
              />
            </div>
            {internet && (
              <Field
                label="Fecha de expiración (Internet)"
                name="internetFechaTemp"
                type="date"
                defaultValue={state.data?.internetFechaTemp}
                errors={state.validationErrors?.internetFechaTemp}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mensajería</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <CheckboxField
                label="Mensajería Corporativa"
                name="mensajeriaCorporativa"
                defaultChecked={!!state.data?.mensajeriaCorporativa}
              />
              <CheckboxField
                label="Chat Internet"
                name="chatInternet"
                defaultChecked={!!state.data?.chatInternet}
                onChange={setChatInternet}
              />
            </div>
            {chatInternet && (
              <Field
                label="Fecha de expiración (Chat Internet)"
                name="chatInternetFechaTemp"
                type="date"
                defaultValue={state.data?.chatInternetFechaTemp}
                errors={state.validationErrors?.chatInternetFechaTemp}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Redes sociales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <CheckboxField
                label="Facebook"
                name="facebook"
                defaultChecked={!!state.data?.facebook}
              />
              <CheckboxField
                label="Twitter"
                name="twitter"
                defaultChecked={!!state.data?.twitter}
              />
              <CheckboxField
                label="Youtube"
                name="youtube"
                defaultChecked={!!state.data?.youtube}
              />
            </div>
            <Field
              label="Otras redes"
              name="otrasRedes"
              defaultValue={state.data?.otrasRedes}
              errors={state.validationErrors?.otrasRedes}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Privilegios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              <CheckboxField
                label="Admin Red"
                name="adminRed"
                defaultChecked={!!state.data?.adminRed}
              />
              <CheckboxField
                label="Admin Local"
                name="adminLocal"
                defaultChecked={!!state.data?.adminLocal}
              />
              <CheckboxField
                label="Usuario Avanzado"
                name="usuarioAvanzado"
                defaultChecked={!!state.data?.usuarioAvanzado}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>FTP UNE</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              <CheckboxField
                label="Lectura"
                name="ftpUneLectura"
                defaultChecked={!!state.data?.ftpUneLectura}
              />
              <CheckboxField
                label="Modificar"
                name="ftpUneModificar"
                defaultChecked={!!state.data?.ftpUneModificar}
              />
              <CheckboxField
                label="Borrar"
                name="ftpUneBorrar"
                defaultChecked={!!state.data?.ftpUneBorrar}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>FTP Entidad</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              <CheckboxField
                label="Lectura"
                name="ftpEntidadLectura"
                defaultChecked={!!state.data?.ftpEntidadLectura}
              />
              <CheckboxField
                label="Modificar"
                name="ftpEntidadModificar"
                defaultChecked={!!state.data?.ftpEntidadModificar}
              />
              <CheckboxField
                label="Borrar"
                name="ftpEntidadBorrar"
                defaultChecked={!!state.data?.ftpEntidadBorrar}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tipo de cuenta</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SelectField
              label="Tipo de cuenta"
              name="tipoCuenta"
              options={ACCOUNT_OPTIONS}
              defaultValue={state.data?.tipoCuenta}
              errors={state.validationErrors?.tipoCuenta}
              onChange={setTipoCuenta}
            />
            {tipoCuenta === "TEMPORAL" && (
              <Field
                label="Fecha de expiración"
                name="fechaExpiracion"
                type="date"
                defaultValue={state.data?.fechaExpiracion}
                errors={state.validationErrors?.fechaExpiracion}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Horarios</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <CheckboxField
              label="Horario Extralaboral"
              name="horarioExtralaboral"
              defaultChecked={!!state.data?.horarioExtralaboral}
              onChange={setHorarioExtralaboral}
            />
            {horarioExtralaboral && (
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Extra desde"
                  name="extraDesde"
                  type="time"
                  defaultValue={state.data?.extraDesde}
                  errors={state.validationErrors?.extraDesde}
                />
                <Field
                  label="Extra hasta"
                  name="extraHasta"
                  type="time"
                  defaultValue={state.data?.extraHasta}
                  errors={state.validationErrors?.extraHasta}
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Sábado desde"
                name="sabadoDesde"
                type="time"
                defaultValue={state.data?.sabadoDesde}
                errors={state.validationErrors?.sabadoDesde}
              />
              <Field
                label="Sábado hasta"
                name="sabadoHasta"
                type="time"
                defaultValue={state.data?.sabadoHasta}
                errors={state.validationErrors?.sabadoHasta}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Domingo desde"
                name="domingoDesde"
                type="time"
                defaultValue={state.data?.domingoDesde}
                errors={state.validationErrors?.domingoDesde}
              />
              <Field
                label="Domingo hasta"
                name="domingoHasta"
                type="time"
                defaultValue={state.data?.domingoHasta}
                errors={state.validationErrors?.domingoHasta}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>APN</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <CheckboxField
                label="Correo Nacional"
                name="apnCorreoNacional"
                defaultChecked={!!state.data?.apnCorreoNacional}
              />
              <CheckboxField
                label="Correo Internacional"
                name="apnCorreoInternacional"
                defaultChecked={!!state.data?.apnCorreoInternacional}
              />
              <CheckboxField
                label="Internet"
                name="apnInternet"
                defaultChecked={!!state.data?.apnInternet}
              />
            </div>
            <Field
              label="Teléfono celular"
              name="telefonoCelular"
              defaultValue={state.data?.telefonoCelular}
              errors={state.validationErrors?.telefonoCelular}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>PC Autorizado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Nombre del PC"
                name="pcNombre"
                defaultValue={state.data?.pcNombre}
                errors={state.validationErrors?.pcNombre}
              />
              <Field
                label="Inventario"
                name="pcInventario"
                defaultValue={state.data?.pcInventario}
                errors={state.validationErrors?.pcInventario}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="PC Adicional - Nombre"
                name="pcAdicionalNombre"
                defaultValue={state.data?.pcAdicionalNombre}
                errors={state.validationErrors?.pcAdicionalNombre}
              />
              <Field
                label="PC Adicional - Inventario"
                name="pcAdicionalInventario"
                defaultValue={state.data?.pcAdicionalInventario}
                errors={state.validationErrors?.pcAdicionalInventario}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Software</CardTitle>
          </CardHeader>
          <CardContent>
            <Field
              label="Software autorizado"
              name="softwareAutorizado"
              defaultValue={state.data?.softwareAutorizado}
              errors={state.validationErrors?.softwareAutorizado}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cuenta de usuario</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field
              label="Cuenta de usuario"
              name="cuentaUsuario"
              defaultValue={state.data?.cuentaUsuario}
              errors={state.validationErrors?.cuentaUsuario}
            />
            <Field
              label="Actividad que realiza"
              name="actividadRealiza"
              defaultValue={state.data?.actividadRealiza}
              errors={state.validationErrors?.actividadRealiza}
            />
            <div className="col-span-full">
              <CheckboxField
                label="Administrador del sistema"
                name="administradorSistema"
                defaultChecked={!!state.data?.administradorSistema}
              />
            </div>
          </CardContent>
        </Card>
        {state.dbErrors && (
          <p className="text-destructive text-center text-sm">
            {state.dbErrors.message}
          </p>
        )}

        <Button className="w-full" disabled={pending} size="lg">
          {pending
            ? "Guardando..."
            : mode === "edit"
              ? "Guardar cambios"
              : "Crear solicitud"}
        </Button>
      </form>
    </div>
  );
}
