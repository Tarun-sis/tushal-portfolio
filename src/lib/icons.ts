import {
  Store, Rocket, UserRound, RefreshCw, DatabaseZap, Smartphone, Palette,
  MousePointerClick, CloudUpload, Mail, Database, type LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  Store, Rocket, UserRound, RefreshCw, DatabaseZap, Smartphone, Palette,
  MousePointerClick, CloudUpload, Mail, Database,
};
export const getIcon = (name: string): LucideIcon => iconMap[name] ?? Store;
