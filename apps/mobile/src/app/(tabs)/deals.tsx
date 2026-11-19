import { StyleSheet, View } from 'react-native';
import { EmptyState, Screen, Text } from '@/design/components';
import { TagIcon } from '@/design/icons';
import { space } from '@/design/tokens';

export default function DealsScreen() {
  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="titleXL" accessibilityRole="header">
          Deals
        </Text>
        <Text variant="body" tone="secondary">
          Promos across every app, ranked by what they save you.
        </Text>
      </View>
      <EmptyState
        icon={TagIcon}
        title="No deals yet"
        body="Deals arrive in a later milestone. They’ll be matched to your memberships so you only see offers you can use."
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: space.xxs,
    marginBottom: space.md,
  },
});
