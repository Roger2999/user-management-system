import type { AccountRequest } from "@/generated/prisma/client";
import { HeaderSection } from "./document/sections/header-section";
import { GestionSection } from "./document/sections/gestion-section";
import { ServicesSection } from "./document/sections/services-section";
import { AccountTypeSection } from "./document/sections/account-type-section";
import { ScheduleSection } from "./document/sections/schedule-section";
import { ApnSection } from "./document/sections/apn-section";
import { PcSection } from "./document/sections/pc-section";
import { SignaturesSection } from "./document/sections/signatures-section";
import { BajaSection } from "./document/sections/baja-section";

interface Props {
  user: AccountRequest;
}

export default function UserAccountDocument({ user }: Props) {
  return (
    <div className="mx-auto w-[201mm] zoom-[0.45] bg-white font-['Liberation_Sans',Arial,Helvetica,sans-serif] text-[8pt] leading-[1.15] text-black sm:zoom-[0.58] md:zoom-[0.7] lg:zoom-[0.85] xl:zoom-[1] print:zoom-[1]!">
      <div className="mb-4 text-center font-['Liberation_Serif','Times_New_Roman',Times,serif] text-[12pt] font-bold">
        ANEXO OM-PP 0001 A1: SOLICITUD DE CUENTA DE USUARIO Y GESTIÓN DE ACCESOS
      </div>

      <div className="border-[0.5pt] border-black">
        <HeaderSection user={user} />
        <GestionSection user={user} />
        <ServicesSection user={user} />
        <AccountTypeSection user={user} />
        <ScheduleSection user={user} />
        <ApnSection user={user} />
        <PcSection user={user} />
        <SignaturesSection user={user} />
        <BajaSection user={user} />
      </div>
    </div>
  );
}
