import {
  LayoutDashboard,
  Briefcase,
  Tags,
  FileText,
  BarChart3,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Applications', href: '/applications', icon: Briefcase },
  { label: 'Roles', href: '/roles', icon: Tags },
  { label: 'Documents', href: '/documents', icon: FileText },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'Settings', href: '/settings', icon: Settings },
];
