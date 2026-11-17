import {
  Bell,
  Bike,
  BookOpen,
  Cake,
  CalendarClock,
  Circle,
  Dumbbell,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  Music,
  PartyPopper,
  PawPrint,
  Plane,
  ShoppingBasket,
  Stethoscope,
  Users,
  type LucideIcon,
} from "lucide-react";

export const CATEGORY_ICONS: { name: string; label: string; Icon: LucideIcon }[] = [
  { name: "GraduationCap", label: "Escuela", Icon: GraduationCap },
  { name: "BookOpen", label: "Estudio", Icon: BookOpen },
  { name: "HeartPulse", label: "Salud", Icon: HeartPulse },
  { name: "Stethoscope", label: "Médico", Icon: Stethoscope },
  { name: "Users", label: "Familia", Icon: Users },
  { name: "Home", label: "Casa", Icon: Home },
  { name: "PartyPopper", label: "Recreación", Icon: PartyPopper },
  { name: "Cake", label: "Cumpleaños", Icon: Cake },
  { name: "Gift", label: "Regalos", Icon: Gift },
  { name: "Bell", label: "Recordatorio", Icon: Bell },
  { name: "CalendarClock", label: "Agenda", Icon: CalendarClock },
  { name: "ShoppingBasket", label: "Compras", Icon: ShoppingBasket },
  { name: "Bike", label: "Deporte", Icon: Bike },
  { name: "Dumbbell", label: "Gimnasio", Icon: Dumbbell },
  { name: "Music", label: "Música", Icon: Music },
  { name: "Plane", label: "Viajes", Icon: Plane },
  { name: "PawPrint", label: "Mascotas", Icon: PawPrint },
  { name: "Circle", label: "Otros", Icon: Circle },
];

const ICON_MAP = new Map(CATEGORY_ICONS.map((entry) => [entry.name, entry.Icon]));

export function getCategoryIcon(name: string | null | undefined): LucideIcon {
  if (!name) return Circle;
  return ICON_MAP.get(name) ?? Circle;
}

export function CategoryIcon({
  name,
  className,
  strokeWidth = 1.8,
}: {
  name: string | null | undefined;
  className?: string;
  strokeWidth?: number;
}) {
  const Icon = getCategoryIcon(name);
  return <Icon className={className} strokeWidth={strokeWidth} aria-hidden />;
}
