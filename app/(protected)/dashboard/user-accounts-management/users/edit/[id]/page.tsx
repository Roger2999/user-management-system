import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import EditUserAccountForm from "../../components/user-account-form";
import { updateAccountRequestAction } from "./actions/update-account-request-action";
import type { CreateUserAccountState } from "@/lib/types";

interface Props {
  params: Promise<{ id: string }>;
}

const toDateInput = (value: Date | null | undefined) =>
  value ? value.toISOString().split("T")[0] : undefined;

const opt = (value: string | null): string | undefined => value ?? undefined;

export default async function EditUserAccountPage({ params }: Props) {
  const { id } = await params;
  const user = await prisma.accountRequest.findUnique({ where: { id } });

  if (!user) {
    notFound();
  }

  const initialData: CreateUserAccountState["data"] = {
    id: user.id,
    requestType: opt(user.requestType),
    folio: opt(user.folio),
    fullName: opt(user.fullName),
    phoneExtension: opt(user.phoneExtension),
    currentPosition: opt(user.currentPosition),
    department: opt(user.department),
    staffType: opt(user.staffType),
    username: opt(user.username),

    nationalEmail: user.nationalEmail,
    internationalEmail: user.internationalEmail,
    internetEmail: user.internetEmail,

    intranetUNE: user.intranetUNE,
    nationalIntranet: user.nationalIntranet,
    internet: user.internet,

    corporateMessaging: user.corporateMessaging,

    facebook: user.facebook,
    twitter: user.twitter,
    youtube: user.youtube,
    whatsapp: user.whatsapp,
    telegram: user.telegram,
    instagram: user.instagram,
    otherNetworks: opt(user.otherNetworks),

    userAccount: user.userAccount,
    advancedUserAccount: user.advancedUserAccount,
    localAdmin: user.localAdmin,
    networkAdmin: user.networkAdmin,

    cloudAccessRead: user.cloudAccessRead,
    cloudAccessModify: user.cloudAccessModify,
    cloudAccessDelete: user.cloudAccessDelete,
    cloudAccessFullControl: user.cloudAccessFullControl,

    accountType: opt(user.accountType),
    expiresAt: toDateInput(user.expiresAt),

    overtimeSchedule: user.overtimeSchedule,
    aroundTheClockSchedule: user.aroundTheClockSchedule,
    overtimeFrom: opt(user.overtimeFrom),
    overtimeTo: opt(user.overtimeTo),
    saturdayFrom: opt(user.saturdayFrom),
    saturdayTo: opt(user.saturdayTo),
    sundayFrom: opt(user.sundayFrom),
    sundayTo: opt(user.sundayTo),

    apnNationalEmail: user.apnNationalEmail,
    apnInternationalEmail: user.apnInternationalEmail,
    apnInternet: user.apnInternet,
    mobilePhone: opt(user.mobilePhone),

    pcName: opt(user.pcName),
    pcAssetTag: opt(user.pcAssetTag),
    additionalPcName: opt(user.additionalPcName),
    additionalPcAssetTag: opt(user.additionalPcAssetTag),

    authorizedSoftware: opt(user.authorizedSoftware),

    deprovisioningReasons: opt(user.deprovisioningReasons),
    deprovisionedAt: toDateInput(user.deprovisionedAt),
  };

  return (
    <div className="py-8">
      <EditUserAccountForm
        mode="edit"
        id={id}
        initialData={initialData}
        action={updateAccountRequestAction}
      />
    </div>
  );
}
