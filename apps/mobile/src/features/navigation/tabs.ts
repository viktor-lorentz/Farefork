import { BellIcon, HeartIcon, HouseIcon, TagIcon, UserIcon, type Icon } from '@/design/icons';

export type TabName = 'index' | 'deals' | 'favorites' | 'alerts' | 'profile';

export type TabConfig = {
  name: TabName;
  title: string;
  icon: Icon;
};

export const tabs: readonly TabConfig[] = [
  { name: 'index', title: 'Home', icon: HouseIcon },
  { name: 'deals', title: 'Deals', icon: TagIcon },
  { name: 'favorites', title: 'Favorites', icon: HeartIcon },
  { name: 'alerts', title: 'Alerts', icon: BellIcon },
  { name: 'profile', title: 'Profile', icon: UserIcon },
];

const tabsByName = new Map<string, TabConfig>(tabs.map((tab) => [tab.name, tab]));

export function tabConfig(name: string): TabConfig | undefined {
  return tabsByName.get(name);
}
