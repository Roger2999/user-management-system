"use client";

import { useActionState, useState } from "react";
import Field from "@/components/field";
import SelectField from "@/components/select-field";
import CheckboxField from "@/components/checkbox-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createUserAccountAction } from "../create/actions/create-user-account-action";
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

  const [requestType, setRequestType] = useState(
    initialData?.requestType ?? (mode === "create" ? "NEW" : ""),
  );
  const [accountType, setAccountType] = useState(
    initialData?.accountType ?? "",
  );
  const [staffType, setStaffType] = useState(initialData?.staffType ?? "");
  const [overtimeSchedule, setOvertimeSchedule] = useState(
    !!initialData?.overtimeSchedule,
  );
  const [aroundTheClockSchedule, setAroundTheClockSchedule] = useState(
    !!initialData?.aroundTheClockSchedule,
  );

  const disableHorarios = aroundTheClockSchedule;

  return (
    <div className="xs:px-8 space-y-6 sm:px-20">
      <h1 className="text-xl font-semibold">
        {mode === "edit"
          ? "Editar solicitud de cuenta"
          : "Crear solicitud de cuenta"}
      </h1>
      <form action={formAction} className="grid gap-6 lg:grid-cols-2">
        {mode === "edit" && id && <input type="hidden" name="id" value={id} />}
        <Card>
          <CardHeader>
            <CardTitle>Encabezado</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SelectField
              label="Tipo de solicitud"
              name="requestType"
              options={REQUEST_OPTIONS}
              value={requestType}
              errors={state.validationErrors?.requestType}
              onChange={setRequestType}
              disabledValues={
                mode === "create" ? ["DEPROVISIONING", "UPDATE"] : ["NEW"]
              }
            />
            {requestType === "DEPROVISIONING" && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field
                  label="Motivos de baja"
                  name="deprovisioningReasons"
                  defaultValue={state.data?.deprovisioningReasons}
                  errors={state.validationErrors?.deprovisioningReasons}
                />
                <Field
                  label="Fecha de baja"
                  name="deprovisionedAt"
                  type="date"
                  defaultValue={state.data?.deprovisionedAt}
                  errors={state.validationErrors?.deprovisionedAt}
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
              name="fullName"
              defaultValue={state.data?.fullName}
              errors={state.validationErrors?.fullName}
            />
            <Field
              label="Teléfono / Extensión"
              name="phoneExtension"
              defaultValue={state.data?.phoneExtension}
              errors={state.validationErrors?.phoneExtension}
            />
            <Field
              label="Cargo que ocupa"
              name="currentPosition"
              defaultValue={state.data?.currentPosition}
              errors={state.validationErrors?.currentPosition}
            />
            <Field
              label="Departamento / Área"
              name="department"
              defaultValue={state.data?.department}
              errors={state.validationErrors?.department}
            />
            <SelectField
              label="Tipo de personal"
              name="staffType"
              options={PERSONAL_OPTIONS}
              value={staffType}
              errors={state.validationErrors?.staffType}
              onChange={setStaffType}
            />
            <Field
              label="Identificador de cuenta de usuario"
              name="username"
              defaultValue={state.data?.username}
              errors={state.validationErrors?.username}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Correo electrónico</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              <CheckboxField
                label="Correo Nacional"
                name="nationalEmail"
                defaultChecked={!!initialData?.nationalEmail}
              />
              <CheckboxField
                label="Correo Internacional"
                name="internationalEmail"
                defaultChecked={!!initialData?.internationalEmail}
              />
              <CheckboxField
                label="Correo Internet"
                name="internetEmail"
                defaultChecked={!!initialData?.internetEmail}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Navegación web</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              <CheckboxField
                label="Intranet UNE"
                name="intranetUNE"
                defaultChecked={!!initialData?.intranetUNE}
              />
              <CheckboxField
                label="Intranet Nacional"
                name="nationalIntranet"
                defaultChecked={!!initialData?.nationalIntranet}
              />
              <CheckboxField
                label="Internet"
                name="internet"
                defaultChecked={!!initialData?.internet}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mensajería</CardTitle>
          </CardHeader>
          <CardContent>
            <CheckboxField
              label="Mensajería Corporativa"
              name="corporateMessaging"
              defaultChecked={!!initialData?.corporateMessaging}
            />
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
                defaultChecked={!!initialData?.facebook}
              />
              <CheckboxField
                label="Twitter"
                name="twitter"
                defaultChecked={!!initialData?.twitter}
              />
              <CheckboxField
                label="Youtube"
                name="youtube"
                defaultChecked={!!initialData?.youtube}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <CheckboxField
                label="WhatsApp"
                name="whatsapp"
                defaultChecked={!!initialData?.whatsapp}
              />
              <CheckboxField
                label="Telegram"
                name="telegram"
                defaultChecked={!!initialData?.telegram}
              />
              <CheckboxField
                label="Instagram"
                name="instagram"
                defaultChecked={!!initialData?.instagram}
              />
            </div>
            <Field
              label="Otras redes"
              name="otherNetworks"
              defaultValue={state.data?.otherNetworks}
              errors={state.validationErrors?.otherNetworks}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Privilegios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <CheckboxField
                label="Usuario"
                name="userAccount"
                defaultChecked={!!initialData?.userAccount}
              />
              <CheckboxField
                label="Usuario Avanzado"
                name="advancedUserAccount"
                defaultChecked={!!initialData?.advancedUserAccount}
              />
              <CheckboxField
                label="Admin Local"
                name="localAdmin"
                defaultChecked={!!initialData?.localAdmin}
              />
              <CheckboxField
                label="Admin Red"
                name="networkAdmin"
                defaultChecked={!!initialData?.networkAdmin}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acceso Nube UNE</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <CheckboxField
                label="Solo lectura"
                name="cloudAccessRead"
                defaultChecked={!!initialData?.cloudAccessRead}
              />
              <CheckboxField
                label="Modificar"
                name="cloudAccessModify"
                defaultChecked={!!initialData?.cloudAccessModify}
              />
              <CheckboxField
                label="Borrar"
                name="cloudAccessDelete"
                defaultChecked={!!initialData?.cloudAccessDelete}
              />
              <CheckboxField
                label="Control total"
                name="cloudAccessFullControl"
                defaultChecked={!!initialData?.cloudAccessFullControl}
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
              name="accountType"
              options={ACCOUNT_OPTIONS}
              value={accountType}
              errors={state.validationErrors?.accountType}
              onChange={setAccountType}
            />
            {accountType === "TEMPORARY" && (
              <Field
                label="Fecha de expiración"
                name="expiresAt"
                type="date"
                defaultValue={state.data?.expiresAt}
                errors={state.validationErrors?.expiresAt}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Horarios</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <CheckboxField
                label="Horario Extralaboral"
                name="overtimeSchedule"
                defaultChecked={!!initialData?.overtimeSchedule}
                onChange={setOvertimeSchedule}
                disabled={disableHorarios}
              />
              <CheckboxField
                label="24 horas"
                name="aroundTheClockSchedule"
                defaultChecked={!!initialData?.aroundTheClockSchedule}
                onChange={setAroundTheClockSchedule}
              />
            </div>
            {overtimeSchedule && !disableHorarios && (
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Extra desde"
                  name="overtimeFrom"
                  type="time"
                  defaultValue={state.data?.overtimeFrom}
                  errors={state.validationErrors?.overtimeFrom}
                />
                <Field
                  label="Extra hasta"
                  name="overtimeTo"
                  type="time"
                  defaultValue={state.data?.overtimeTo}
                  errors={state.validationErrors?.overtimeTo}
                />
              </div>
            )}
            {!disableHorarios && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Field
                    label="Sábado desde"
                    name="saturdayFrom"
                    type="time"
                    defaultValue={state.data?.saturdayFrom}
                    errors={state.validationErrors?.saturdayFrom}
                  />
                  <Field
                    label="Sábado hasta"
                    name="saturdayTo"
                    type="time"
                    defaultValue={state.data?.saturdayTo}
                    errors={state.validationErrors?.saturdayTo}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field
                    label="Domingo desde"
                    name="sundayFrom"
                    type="time"
                    defaultValue={state.data?.sundayFrom}
                    errors={state.validationErrors?.sundayFrom}
                  />
                  <Field
                    label="Domingo hasta"
                    name="sundayTo"
                    type="time"
                    defaultValue={state.data?.sundayTo}
                    errors={state.validationErrors?.sundayTo}
                  />
                </div>
              </>
            )}
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
                name="apnNationalEmail"
                defaultChecked={!!initialData?.apnNationalEmail}
              />
              <CheckboxField
                label="Correo Internacional"
                name="apnInternationalEmail"
                defaultChecked={!!initialData?.apnInternationalEmail}
              />
              <CheckboxField
                label="Internet"
                name="apnInternet"
                defaultChecked={!!initialData?.apnInternet}
              />
            </div>
            <Field
              label="Teléfono celular"
              name="mobilePhone"
              defaultValue={state.data?.mobilePhone}
              errors={state.validationErrors?.mobilePhone}
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
                name="pcName"
                defaultValue={state.data?.pcName}
                errors={state.validationErrors?.pcName}
              />
              <Field
                label="Inventario"
                name="pcAssetTag"
                defaultValue={state.data?.pcAssetTag}
                errors={state.validationErrors?.pcAssetTag}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="PC Adicional - Nombre"
                name="additionalPcName"
                defaultValue={state.data?.additionalPcName}
                errors={state.validationErrors?.additionalPcName}
              />
              <Field
                label="PC Adicional - Inventario"
                name="additionalPcAssetTag"
                defaultValue={state.data?.additionalPcAssetTag}
                errors={state.validationErrors?.additionalPcAssetTag}
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
              name="authorizedSoftware"
              defaultValue={state.data?.authorizedSoftware}
              errors={state.validationErrors?.authorizedSoftware}
            />
          </CardContent>
        </Card>
        {state.dbErrors && (
          <p className="text-destructive text-center text-sm">
            {state.dbErrors.message}
          </p>
        )}

        <Button
          className="bg-success min-h-14 w-full text-xl font-bold lg:col-span-2"
          disabled={pending}
        >
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
