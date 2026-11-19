import { StyleSheet, View } from 'react-native';
import { Screen, ScreenHeader, Text } from '@/design/components';
import { useTheme } from '@/design/theme';
import { space } from '@/design/tokens';
import { MembershipList } from '@/features/memberships/MembershipList';

export default function MembershipsScreen() {
  const { colors } = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Memberships" large />
      <Screen padTop={false} contentStyle={styles.content}>
        <Text variant="body" tone="secondary">
          Turn on the plans you pay for. We apply their perks before ranking prices, so “best” means
          best for you.
        </Text>
        <MembershipList />
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    gap: space.md,
  },
});
