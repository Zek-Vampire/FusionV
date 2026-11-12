import {
  Bell,
  CalendarDays,
  Compass,
  FolderOpen,
  GraduationCap,
  LayoutDashboard,
  MessagesSquare,
  Palette,
  Search,
  Settings,
  User,
  Users,
} from 'lucide-react';
import { paths } from '@/routes/paths';

export const navigationGroups = [
  {
    label: 'Workspace',
    items: [
      { to: paths.dashboard, label: 'Dashboard', icon: LayoutDashboard },
      { to: paths.teams, label: 'Teams', icon: Users },
      { to: paths.community, label: 'Community', icon: Compass },
      { to: paths.students, label: 'Students', icon: GraduationCap },
      { to: paths.messages, label: 'Messages', icon: MessagesSquare },
      { to: paths.notifications, label: 'Notifications', icon: Bell },
    ],
  },
  {
    label: 'Explore',
    items: [
      { to: paths.hackathons, label: 'Hackathons', icon: CalendarDays },
      { to: paths.resources, label: 'Resources', icon: FolderOpen },
      { to: paths.search, label: 'Search', icon: Search },
      { to: paths.designSystem, label: 'Design system', icon: Palette },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: paths.profile, label: 'My profile', icon: User },
      { to: paths.settings, label: 'Settings', icon: Settings },
    ],
  },
];

export const publicNav = [
  { to: paths.hackathons, label: 'Hackathons' },
  { to: paths.resources, label: 'Resources' },
  { to: paths.search, label: 'Search' },
];

export const publicNavigationGroups = [
  {
    label: 'Explore',
    items: [
      { to: paths.hackathons, label: 'Hackathons', icon: CalendarDays },
      { to: paths.resources, label: 'Resources', icon: FolderOpen },
      { to: paths.search, label: 'Search', icon: Search },
    ],
  },
];

export function isPathActive(pathname, to) {
  if (to === '/') return pathname === '/';
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function pageTitleFor(pathname) {
  const all = navigationGroups.flatMap((group) => group.items);
  const match = all.find((item) => isPathActive(pathname, item.to));
  return match?.label ?? 'FusionV';
}
