import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { EmptyState, Screen, Text } from '@/design/components';
import { HeartIcon } from '@/design/icons';
import { space } from '@/design/tokens';

export default function FavoritesScreen() {
  const router = useRouter();
  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="titleXL" accessibilityRole="header">
          Favorites
        </Text>
        <Text variant="body" tone="secondary">
          Routes and restaurants you price often.
        </Text>
      </View>
      <EmptyState
        icon={HeartIcon}
        title="Nothing saved"
        body="Tap the heart on any route or restaurant to keep it here and re-check prices in one tap."
        action={{
          label: 'Compare a ride',
          onPress: () => {
            router.push('/rides/search');
          },
        }}
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
