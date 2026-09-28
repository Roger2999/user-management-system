"use server";

import z from "zod";
import { AccountRequestSchema } from "../models/account-request-schema.model";
import {
  findDuplicateFields,
  uniqueFieldMessage,
} from "../models/unique-account-request";
import prisma from "@/lib/prisma";
import { CreateUserAccountState } from "@/lib/types";
import { requireAdmin } from "@/helpers/requireAdmin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createUserAccountAction(
  _prevState: CreateUserAccountState,
  formData: FormData,
): Promise<CreateUserAccountState> {
  await requireAdmin();

  const fields = {
    requestType: (formData.get("requestType") as string) || undefined,
    folio: (formData.get("folio") as string)?.trim().toUpperCase() ?? "",
    fullName: formData.get("fullName") as string,
    phoneExtension: (formData.get("phoneExtension") as string) || undefined,
    currentPosition: formData.get("currentPosition") as string,
    department: formData.get("department") as string,
    staffType: (formData.get("staffType") as string) || undefined,
    username: (formData.get("username") as string) || undefined,

    nationalEmail: formData.get("nationalEmail") === "on",
    internationalEmail: formData.get("internationalEmail") === "on",
    internetEmail: formData.get("internetEmail") === "on",

    intranetUNE: formData.get("intranetUNE") === "on",
    nationalIntranet: formData.get("nationalIntranet") === "on",
    internet: formData.get("internet") === "on",

    corporateMessaging: formData.get("corporateMessaging") === "on",

    facebook: formData.get("facebook") === "on",
    twitter: formData.get("twitter") === "on",
    youtube: formData.get("youtube") === "on",
    whatsapp: formData.get("whatsapp") === "on",
    telegram: formData.get("telegram") === "on",
    instagram: formData.get("instagram") === "on",
    otherNetworks: (formData.get("otherNetworks") as string) || undefined,

    userAccount: formData.get("userAccount") === "on",
    advancedUserAccount: formData.get("advancedUserAccount") === "on",
    localAdmin: formData.get("localAdmin") === "on",
    networkAdmin: formData.get("networkAdmin") === "on",

    cloudAccessRead: formData.get("cloudAccessRead") === "on",
    cloudAccessModify: formData.get("cloudAccessModify") === "on",
    cloudAccessDelete: formData.get("cloudAccessDelete") === "on",
    cloudAccessFullControl: formData.get("cloudAccessFullControl") === "on",

    accountType: (formData.get("accountType") as string) || undefined,
    expiresAt: (formData.get("expiresAt") as string) || undefined,

    overtimeSchedule: formData.get("overtimeSchedule") === "on",
    aroundTheClockSchedule: formData.get("aroundTheClockSchedule") === "on",
    overtimeFrom: (formData.get("overtimeFrom") as string) || undefined,
    overtimeTo: (formData.get("overtimeTo") as string) || undefined,
    saturdayFrom: (formData.get("saturdayFrom") as string) || undefined,
    saturdayTo: (formData.get("saturdayTo") as string) || undefined,
    sundayFrom: (formData.get("sundayFrom") as string) || undefined,
    sundayTo: (formData.get("sundayTo") as string) || undefined,

    apnNationalEmail: formData.get("apnNationalEmail") === "on",
    apnInternationalEmail: formData.get("apnInternationalEmail") === "on",
    apnInternet: formData.get("apnInternet") === "on",
    mobilePhone: (formData.get("mobilePhone") as string) || undefined,

    pcName: (formData.get("pcName") as string) || undefined,
    pcAssetTag: (formData.get("pcAssetTag") as string) || undefined,
    additionalPcName: (formData.get("additionalPcName") as string) || undefined,
    additionalPcAssetTag:
      (formData.get("additionalPcAssetTag") as string) || undefined,

    authorizedSoftware:
      (formData.get("authorizedSoftware") as string) || undefined,
    deprovisioningReasons:
      (formData.get("deprovisioningReasons") as string) || undefined,
    deprovisionedAt: (formData.get("deprovisionedAt") as string) || undefined,
  };

  const repopulateData = {
    requestType: fields.requestType,
    folio: fields.folio,
    fullName: fields.fullName,
    phoneExtension: fields.phoneExtension,
    currentPosition: fields.currentPosition,
    department: fields.department,
    staffType: fields.staffType,
    username: fields.username,

    nationalEmail: fields.nationalEmail,
    internationalEmail: fields.internationalEmail,
    internetEmail: fields.internetEmail,

    intranetUNE: fields.intranetUNE,
    nationalIntranet: fields.nationalIntranet,
    internet: fields.internet,

    corporateMessaging: fields.corporateMessaging,

    facebook: fields.facebook,
    twitter: fields.twitter,
    youtube: fields.youtube,
    whatsapp: fields.whatsapp,
    telegram: fields.telegram,
    instagram: fields.instagram,
    otherNetworks: fields.otherNetworks,

    userAccount: fields.userAccount,
    advancedUserAccount: fields.advancedUserAccount,
    localAdmin: fields.localAdmin,
    networkAdmin: fields.networkAdmin,

    cloudAccessRead: fields.cloudAccessRead,
    cloudAccessModify: fields.cloudAccessModify,
    cloudAccessDelete: fields.cloudAccessDelete,
    cloudAccessFullControl: fields.cloudAccessFullControl,

    accountType: fields.accountType,
    expiresAt: fields.expiresAt,

    overtimeSchedule: fields.overtimeSchedule,
    aroundTheClockSchedule: fields.aroundTheClockSchedule,
    overtimeFrom: fields.overtimeFrom,
    overtimeTo: fields.overtimeTo,
    saturdayFrom: fields.saturdayFrom,
    saturdayTo: fields.saturdayTo,
    sundayFrom: fields.sundayFrom,
    sundayTo: fields.sundayTo,

    apnNationalEmail: fields.apnNationalEmail,
    apnInternationalEmail: fields.apnInternationalEmail,
    apnInternet: fields.apnInternet,
    mobilePhone: fields.mobilePhone,

    pcName: fields.pcName,
    pcAssetTag: fields.pcAssetTag,
    additionalPcName: fields.additionalPcName,
    additionalPcAssetTag: fields.additionalPcAssetTag,

    authorizedSoftware: fields.authorizedSoftware,
    deprovisioningReasons: fields.deprovisioningReasons,
    deprovisionedAt: fields.deprovisionedAt,
  };

  const validatedFields = AccountRequestSchema.safeParse(fields);

  if (!validatedFields.success) {
    return {
      data: repopulateData,
      success: false,
      dbErrors: null,
      validationErrors: z.flattenError(validatedFields.error).fieldErrors,
    };
  }

  const duplicatedFields = await findDuplicateFields(validatedFields.data);

  if (duplicatedFields.length > 0) {
    return {
      data: repopulateData,
      success: false,
      dbErrors: null,
      validationErrors: Object.fromEntries(
        duplicatedFields.map((field) => [field, [uniqueFieldMessage(field)]]),
      ),
    };
  }

  const toDate = (value: string | undefined) =>
    value ? new Date(value) : null;

  try {
    const data = validatedFields.data;

    await prisma.accountRequest.create({
      data: {
        ...data,
        expiresAt: toDate(data.expiresAt),
        deprovisionedAt: toDate(data.deprovisionedAt),
      },
    });
  } catch (error) {
    console.error(
      "createUserAccountAction: error al crear la solicitud",
      error,
    );
    return {
      data: repopulateData,
      success: false,
      dbErrors: {
        message: "Error al procesar la solicitud. Intenta de nuevo.",
      },
      validationErrors: null,
    };
  }
  revalidatePath("/dashboard/user-accounts-management/users");
  redirect("/dashboard/user-accounts-management/users?success=created");
}
