"use client";

import { useActionState, useState } from "react";
import Field from "@/components/field";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { createUserAccountAction } from "../actions/create-user-account-action";
import type { CreateUserAccountState } from "@/lib/types";
import {
  ACCOUNT_OPTIONS,
  PERSONAL_OPTIONS,
  REQUEST_OPTIONS,
} from "@/lib/constants";

function SelectField({
  label,
  name,
  options,
  defaultValue,
  errors,
  onChange,
}: {
  label: string;
  name: string;
  options: readonly { readonly value: string; readonly label: string }[];
  defaultValue?: string;
  errors?: string[];
  onChange?: (value: string) => void;
}) {
  return (
    <div className="space-y-2 min-h-21">
      <Label htmlFor={name}>{label}</Label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue}
        onChange={(e) => onChange?.(e.target.value)}
        className={cn(
          "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed md:text-sm dark:bg-input/30",
          errors && "border-red-500",
        )}
      >
        <option value="">Seleccionar...</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ul>
        {errors?.map((e, i) => (
          <li className="text-sm text-red-500" key={i}>
            {e}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CheckboxField({
  label,
  name,
  defaultChecked,
  onChange,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer text-sm">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        onChange={(e) => onChange?.(e.target.checked)}
        className="size-4 accent-primary"
      />
      {label}
    </label>
  );
}

export default function CreateUserAccountForm() {
  const initialState: CreateUserAccountState = {
    data: undefined,
    success: false,
    dbErrors: null,
    validationErrors: null,
  };
  const [state, action, pending] = useActionState(
    createUserAccountAction,
    initialState,
  );

  const [correoInternet, setCorreoInternet] = useState(false);
  const [internet, setInternet] = useState(false);
  const [chatInternet, setChatInternet] = useState(false);
  const [tipoCuenta, setTipoCuenta] = useState("");
  const [horarioExtralaboral, setHorarioExtralaboral] = useState(false);
  const [bajaEntidad, setBajaEntidad] = useState(false);

  const f = (field: string): string | undefined =>
    (state.data as Record<string, string | undefined> | undefined)?.[field];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Crear solicitud de cuenta</h1>
      <form action={action} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Encabezado</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField
              label="Tipo de solicitud"
              name="tipoSolicitud"
              options={REQUEST_OPTIONS}
              defaultValue={f("tipoSolicitud")}
              errors={state.validationErrors?.tipoSolicitud}
            />
            <Field
              label="Folio"
              name="folio"
              defaultValue={f("folio")}
              errors={state.validationErrors?.folio}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Datos personales</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              label="Nombre y apellidos"
              name="nombreApellidos"
              defaultValue={f("nombreApellidos")}
              errors={state.validationErrors?.nombreApellidos}
            />
            <Field
              label="Cargo que ocupa"
              name="cargoOcupa"
              defaultValue={f("cargoOcupa")}
              errors={state.validationErrors?.cargoOcupa}
            />
            <Field
              label="Departamento / Área"
              name="departamentoArea"
              defaultValue={f("departamentoArea")}
              errors={state.validationErrors?.departamentoArea}
            />
            <SelectField
              label="Tipo de personal"
              name="tipoPersonal"
              options={PERSONAL_OPTIONS}
              defaultValue={f("tipoPersonal")}
              errors={state.validationErrors?.tipoPersonal}
            />
            <Field
              label="Cuenta"
              name="cuenta"
              defaultValue={f("cuenta")}
              errors={state.validationErrors?.cuenta}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Correo electrónico</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <CheckboxField label="Correo Local" name="correoLocal" />
              <CheckboxField label="Correo Nacional" name="correoNacional" />
              <CheckboxField
                label="Correo Internacional"
                name="correoInternacional"
              />
              <CheckboxField
                label="Correo Internet"
                name="correoInternet"
                onChange={setCorreoInternet}
              />
            </div>
            {correoInternet && (
              <Field
                label="Fecha de expiración (Correo Internet)"
                name="correoInternetFechaTemp"
                type="date"
                defaultValue={f("correoInternetFechaTemp")}
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
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <CheckboxField label="Intranet UNE" name="intranetUNE" />
              <CheckboxField
                label="Intranet Nacional"
                name="intranetNacional"
              />
              <CheckboxField
                label="Internet"
                name="internet"
                onChange={setInternet}
              />
            </div>
            {internet && (
              <Field
                label="Fecha de expiración (Internet)"
                name="internetFechaTemp"
                type="date"
                defaultValue={f("internetFechaTemp")}
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
              />
              <CheckboxField
                label="Chat Internet"
                name="chatInternet"
                onChange={setChatInternet}
              />
            </div>
            {chatInternet && (
              <Field
                label="Fecha de expiración (Chat Internet)"
                name="chatInternetFechaTemp"
                type="date"
                defaultValue={f("chatInternetFechaTemp")}
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
              <CheckboxField label="Facebook" name="facebook" />
              <CheckboxField label="Twitter" name="twitter" />
              <CheckboxField label="Youtube" name="youtube" />
            </div>
            <Field
              label="Otras redes"
              name="otrasRedes"
              defaultValue={f("otrasRedes")}
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
              <CheckboxField label="Admin Red" name="adminRed" />
              <CheckboxField label="Admin Local" name="adminLocal" />
              <CheckboxField label="Usuario Avanzado" name="usuarioAvanzado" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>FTP UNE</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              <CheckboxField label="Lectura" name="ftpUneLectura" />
              <CheckboxField label="Modificar" name="ftpUneModificar" />
              <CheckboxField label="Borrar" name="ftpUneBorrar" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>FTP Entidad</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              <CheckboxField label="Lectura" name="ftpEntidadLectura" />
              <CheckboxField label="Modificar" name="ftpEntidadModificar" />
              <CheckboxField label="Borrar" name="ftpEntidadBorrar" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tipo de cuenta</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField
              label="Tipo de cuenta"
              name="tipoCuenta"
              options={ACCOUNT_OPTIONS}
              defaultValue={f("tipoCuenta")}
              errors={state.validationErrors?.tipoCuenta}
              onChange={setTipoCuenta}
            />
            {tipoCuenta === "TEMPORAL" && (
              <Field
                label="Fecha de expiración"
                name="fechaExpiracion"
                type="date"
                defaultValue={f("fechaExpiracion")}
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
              onChange={setHorarioExtralaboral}
            />
            {horarioExtralaboral && (
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Extra desde"
                  name="extraDesde"
                  type="time"
                  defaultValue={f("extraDesde")}
                  errors={state.validationErrors?.extraDesde}
                />
                <Field
                  label="Extra hasta"
                  name="extraHasta"
                  type="time"
                  defaultValue={f("extraHasta")}
                  errors={state.validationErrors?.extraHasta}
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Sábado desde"
                name="sabadoDesde"
                type="time"
                defaultValue={f("sabadoDesde")}
                errors={state.validationErrors?.sabadoDesde}
              />
              <Field
                label="Sábado hasta"
                name="sabadoHasta"
                type="time"
                defaultValue={f("sabadoHasta")}
                errors={state.validationErrors?.sabadoHasta}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Domingo desde"
                name="domingoDesde"
                type="time"
                defaultValue={f("domingoDesde")}
                errors={state.validationErrors?.domingoDesde}
              />
              <Field
                label="Domingo hasta"
                name="domingoHasta"
                type="time"
                defaultValue={f("domingoHasta")}
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
              <CheckboxField label="Correo Nacional" name="apnCorreoNacional" />
              <CheckboxField
                label="Correo Internacional"
                name="apnCorreoInternacional"
              />
              <CheckboxField label="Internet" name="apnInternet" />
            </div>
            <Field
              label="Teléfono celular"
              name="telefonoCelular"
              defaultValue={f("telefonoCelular")}
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
                defaultValue={f("pcNombre")}
                errors={state.validationErrors?.pcNombre}
              />
              <Field
                label="Inventario"
                name="pcInventario"
                defaultValue={f("pcInventario")}
                errors={state.validationErrors?.pcNombre}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="PC Adicional - Nombre"
                name="pcAdicionalNombre"
                defaultValue={f("pcAdicionalNombre")}
                errors={state.validationErrors?.pcAdicionalNombre}
              />
              <Field
                label="PC Adicional - Inventario"
                name="pcAdicionalInventario"
                defaultValue={f("pcAdicionalInventario")}
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
              defaultValue={f("softwareAutorizado")}
              errors={state.validationErrors?.softwareAutorizado}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cuenta de usuario</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              label="Cuenta de usuario"
              name="cuentaUsuario"
              defaultValue={f("cuentaUsuario")}
              errors={state.validationErrors?.cuentaUsuario}
            />
            <Field
              label="Actividad que realiza"
              name="actividadRealiza"
              defaultValue={f("actividadRealiza")}
              errors={state.validationErrors?.actividadRealiza}
            />
            <div className="col-span-full">
              <CheckboxField
                label="Administrador del sistema"
                name="administradorSistema"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Firmas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Field
                label="Solicitado - Nombre"
                name="solicitadoNombre"
                defaultValue={f("solicitadoNombre")}
                errors={state.validationErrors?.solicitadoNombre}
              />
              <Field
                label="Solicitado - Cargo"
                name="solicitadoCargo"
                defaultValue={f("solicitadoCargo")}
                errors={state.validationErrors?.solicitadoCargo}
              />
              <Field
                label="Solicitado - Fecha"
                name="solicitadoFecha"
                type="date"
                defaultValue={f("solicitadoFecha")}
                errors={state.validationErrors?.solicitadoFecha}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Field
                label="Revisado - Nombre"
                name="revisadoNombre"
                defaultValue={f("revisadoNombre")}
                errors={state.validationErrors?.revisadoNombre}
              />
              <Field
                label="Revisado - Cargo"
                name="revisadoCargo"
                defaultValue={f("revisadoCargo")}
                errors={state.validationErrors?.revisadoCargo}
              />
              <Field
                label="Revisado - Fecha"
                name="revisadoFecha"
                type="date"
                defaultValue={f("revisadoFecha")}
                errors={state.validationErrors?.revisadoFecha}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Field
                label="Aprobado - Nombre"
                name="aprobadoNombre"
                defaultValue={f("aprobadoNombre")}
                errors={state.validationErrors?.aprobadoNombre}
              />
              <Field
                label="Aprobado - Cargo"
                name="aprobadoCargo"
                defaultValue={f("aprobadoCargo")}
                errors={state.validationErrors?.aprobadoCargo}
              />
              <Field
                label="Aprobado - Fecha"
                name="aprobadoFecha"
                type="date"
                defaultValue={f("aprobadoFecha")}
                errors={state.validationErrors?.aprobadoFecha}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Field
                label="Ejecutado - Nombre"
                name="ejecutadoNombre"
                defaultValue={f("ejecutadoNombre")}
                errors={state.validationErrors?.ejecutadoNombre}
              />
              <Field
                label="Ejecutado - Cargo"
                name="ejecutadoCargo"
                defaultValue={f("ejecutadoCargo")}
                errors={state.validationErrors?.ejecutadoCargo}
              />
              <Field
                label="Ejecutado - Fecha"
                name="ejecutadoFecha"
                type="date"
                defaultValue={f("ejecutadoFecha")}
                errors={state.validationErrors?.ejecutadoFecha}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Baja</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <CheckboxField
              label="Baja de entidad"
              name="bajaEntidad"
              onChange={setBajaEntidad}
            />
            {bajaEntidad && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field
                  label="Motivos de baja"
                  name="motivosBaja"
                  defaultValue={f("motivosBaja")}
                  errors={state.validationErrors?.motivosBaja}
                />
                <Field
                  label="Fecha de baja"
                  name="fechaBaja"
                  type="date"
                  defaultValue={f("fechaBaja")}
                  errors={state.validationErrors?.fechaBaja}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {state.success && (
          <p className="text-sm text-green-500 text-center">
            Solicitud creada exitosamente
          </p>
        )}

        {state.dbErrors && (
          <p className="text-sm text-red-500 text-center">
            {state.dbErrors.message}
          </p>
        )}

        <Button className="w-full" disabled={pending} size="lg">
          {pending ? "Guardando..." : "Crear solicitud"}
        </Button>
      </form>
    </div>
  );
}
