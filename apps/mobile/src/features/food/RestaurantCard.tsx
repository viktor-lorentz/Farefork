import type { RestaurantSummary } from '@repo/shared';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/design/components';
import { useTheme } from '@/design/theme';
import { radius, space } from '@/design/tokens';
import { ProviderLogo } from '@/features/providers/ProviderLogo';
import { restaurantMeta } from './format';
import { RestaurantPhoto } from './RestaurantPhoto';

export function RestaurantCard({
  restaurant,
  onPress,
}: {
  restaurant: RestaurantSummary;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const [hovered, setHovered] = useState(false);
  const meta = restaurantMeta(restaurant);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${restaurant.name}, ${meta}, on ${restaurant.providerIds.length} apps`}
      onPress={onPress}
      onHoverIn={() => {
        setHovered(true);
      }}
      onHoverOut={() => {
        setHovered(false);
      }}
      style={({ pressed }) => [styles.card, (pressed || hovered) && styles.pressed]}
    >
      <View>
        <RestaurantPhoto restaurant={restaurant} style={styles.photo} />
        <View style={[styles.logos, { backgroundColor: colors.surface }]}>
          {restaurant.providerIds.map((id) => (
            <ProviderLogo key={id} providerId={id} size={24} decorative />
          ))}
        </View>
      </View>
      <View style={styles.text}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {restaurant.name}
        </Text>
        <Text variant="caption" tone="secondary" numberOfLines={1}>
          {meta}
        </Text>
        {restaurant.address !== null ? (
          <Text variant="caption" tone="tertiary" numberOfLines={1}>
            {restaurant.address}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { gap: space.xs },
  pressed: { opacity: 0.85 },
  photo: { width: '100%', aspectRatio: 16 / 9, borderRadius: radius.lg },
  logos: {
    position: 'absolute',
    right: space.xs,
    bottom: space.xs,
    flexDirection: 'row',
    gap: 3,
    padding: 3,
    borderRadius: radius.sm,
  },
  text: { gap: 2, paddingHorizontal: 2 },
});
