import { StyleSheet, View } from 'react-native';
import { EmptyState, Screen, Text } from '@/design/components';
import { BellRingingIcon } from '@/design/icons';
import { space } from '@/design/tokens';

export default function AlertsScreen() {
  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="titleXL" accessibilityRole="header">
          Alerts
        </Text>
        <Text variant="body" tone="secondary">
          Get pinged when a ride drops below your price.
        </Text>
      </View>
      <EmptyState
        icon={BellRingingIcon}
        title="No alerts set"
        body="Price alerts arrive in a later milestone. Set a target on any route and we’ll watch it for you."
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
