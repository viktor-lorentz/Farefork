import { Tabs } from 'expo-router/js-tabs';
import { useIsDesktopLayout } from '@/design/layout';
import { useTheme } from '@/design/theme';
import { AppTabBar } from '@/features/navigation/AppTabBar';
import { tabs } from '@/features/navigation/tabs';

export default function TabsLayout() {
  const desktop = useIsDesktopLayout();
  const { colors } = useTheme();
  return (
    <Tabs
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarPosition: desktop ? 'top' : 'bottom',
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.title }} />
      ))}
    </Tabs>
  );
}
