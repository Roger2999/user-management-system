import {
  AlarmClock,
  BadgeCheck,
  Clock,
  PenLine,
  RefreshCw,
  UserMinus,
  UserPlus,
} from "lucide-react";

export interface DashboardStatCard {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "default" | "destructive" | "amber";
}

export interface DashboardSection {
  title: string;
  cards: DashboardStatCard[];
}

export const dashboardSections: DashboardSection[] = [
  {
    title: "Estado de cuentas",
    cards: [
      {
        value: "pendingSignature",
        label: "Pendientes de firma",
        icon: PenLine,
        tone: "destructive",
      },
      {
        value: "expired",
        label: "Cuentas expiradas",
        icon: AlarmClock,
        tone: "destructive",
      },
      {
        value: "expiredIn7",
        label: "Por expirar (≤7 días)",
        icon: Clock,
        tone: "amber",
      },
    ],
  },
  {
    title: "Por tipo de solicitud",
    cards: [
      { value: "new", label: "Alta", icon: UserPlus },
      { value: "update", label: "Actualización", icon: RefreshCw },
      { value: "deprovisioning", label: "Baja", icon: UserMinus },
    ],
  },
  {
    title: "Por tipo de cuenta",
    cards: [
      { value: "permanent", label: "Cuentas permanentes", icon: BadgeCheck },
      { value: "temporary", label: "Cuentas temporales", icon: Clock },
    ],
  },
];
