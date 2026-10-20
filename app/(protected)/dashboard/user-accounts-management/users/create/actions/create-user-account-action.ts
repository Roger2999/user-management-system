"use server";

import z from "zod";
import { AccountRequestSchema } from "../models/account-request-schema.model";
import {
  findDuplicateFields,
  uniqueFieldMessage,
} from "../models/unique-account-request";
import prisma from "@/lib/prisma";
import { CreateUserAccountState } from "@/lib/types";
import { checkboxField, optionalTextField, textField } from "@/lib/form-data";
import { requireAdmin } from "@/helpers/requireAdmin";
import { getSession } from "@/helpers/getSession";
import { AUDIT_ENTITY, recordAudit } from "@/lib/audit";
import { AuditAction } from "@/generated/prisma/enums";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createUserAccountAction(
  _prevState: CreateUserAccountState,
  formData: FormData,
): Promise<CreateUserAccountState> {
  await requireAdmin();

  const fields = {
    requestType: optionalTextField(formData, "requestType"),
    folio: textField(formData, "folio").trim().toUpperCase(),
    fullName: textField(formData, "fullName"),
    phoneExtension: optionalTextField(formData, "phoneExtension"),
    currentPosition: textField(formData, "currentPosition"),
    department: textField(formData, "department"),
    staffType: optionalTextField(formData, "staffType"),
    username: textField(formData, "username"),

    nationalEmail: checkboxField(formData, "nationalEmail"),
    internationalEmail: checkboxField(formData, "internationalEmail"),
    internetEmail: checkboxField(formData, "internetEmail"),

    intranetUNE: checkboxField(formData, "intranetUNE"),
    nationalIntranet: checkboxField(formData, "nationalIntranet"),
    internet: checkboxField(formData, "internet"),

    corporateMessaging: checkboxField(formData, "corporateMessaging"),

    facebook: checkboxField(formData, "facebook"),
    twitter: checkboxField(formData, "twitter"),
    youtube: checkboxField(formData, "youtube"),
    whatsapp: checkboxField(formData, "whatsapp"),
    telegram: checkboxField(formData, "telegram"),
    instagram: checkboxField(formData, "instagram"),
    otherNetworks: optionalTextField(formData, "otherNetworks"),

    userAccount: checkboxField(formData, "userAccount"),
    advancedUserAccount: checkboxField(formData, "advancedUserAccount"),
    localAdmin: checkboxField(formData, "localAdmin"),
    networkAdmin: checkboxField(formData, "networkAdmin"),

    cloudAccessRead: checkboxField(formData, "cloudAccessRead"),
    cloudAccessModify: checkboxField(formData, "cloudAccessModify"),
    cloudAccessDelete: checkboxField(formData, "cloudAccessDelete"),
    cloudAccessFullControl: checkboxField(formData, "cloudAccessFullControl"),

    accountType: optionalTextField(formData, "accountType"),
    expiresAt: optionalTextField(formData, "expiresAt"),

    overtimeSchedule: checkboxField(formData, "overtimeSchedule"),
    aroundTheClockSchedule: checkboxField(formData, "aroundTheClockSchedule"),
    overtimeFrom: optionalTextField(formData, "overtimeFrom"),
    overtimeTo: optionalTextField(formData, "overtimeTo"),
    saturdayFrom: optionalTextField(formData, "saturdayFrom"),
    saturdayTo: optionalTextField(formData, "saturdayTo"),
    sundayFrom: optionalTextField(formData, "sundayFrom"),
    sundayTo: optionalTextField(formData, "sundayTo"),

    apnNationalEmail: checkboxField(formData, "apnNationalEmail"),
    apnInternationalEmail: checkboxField(formData, "apnInternationalEmail"),
    apnInternet: checkboxField(formData, "apnInternet"),
    mobilePhone: optionalTextField(formData, "mobilePhone"),

    pcName: textField(formData, "pcName"),
    pcAssetTag: textField(formData, "pcAssetTag"),
    additionalPcName: optionalTextField(formData, "additionalPcName"),
    additionalPcAssetTag: optionalTextField(formData, "additionalPcAssetTag"),

    authorizedSoftware: optionalTextField(formData, "authorizedSoftware"),
    deprovisioningReasons: optionalTextField(formData, "deprovisioningReasons"),
    deprovisionedAt: optionalTextField(formData, "deprovisionedAt"),
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

  const session = await getSession();
  const actor = session?.user
    ? { id: session.user.id, name: session.user.name ?? session.user.username }
    : null;

  try {
    const data = validatedFields.data;

    await prisma.$transaction(async (tx) => {
      const request = await tx.accountRequest.create({
        data: {
          ...data,
          expiresAt: toDate(data.expiresAt),
          deprovisionedAt: toDate(data.deprovisionedAt),
          createdByUserId: actor?.id ?? null,
          updatedByUserId: actor?.id ?? null,
        },
      });

      await recordAudit(tx, {
        action: AuditAction.CREATE,
        entityType: AUDIT_ENTITY.ACCOUNT_REQUEST,
        entityId: request.id,
        actor,
        metadata: {
          folio: request.folio,
          requestType: request.requestType,
        },
      });
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
