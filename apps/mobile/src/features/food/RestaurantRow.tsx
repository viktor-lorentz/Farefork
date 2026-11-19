import type { RestaurantSummary } from '@repo/shared';
import { StyleSheet, View } from 'react-native';
import { ListRow, Text } from '@/design/components';
import { useTheme } from '@/design/theme';
import { radius } from '@/design/tokens';
import { ProviderLogo } from '@/features/providers/ProviderLogo';
import { restaurantMeta } from './format';

export type RestaurantRowProps = {
  restaurant: RestaurantSummary;
  onPress: () => void;
  divider: boolean;
};

function Monogram({ name }: { name: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.monogram, { backgroundColor: colors.fill }]}>
      <Text variant="titleS">{name.slice(0, 1).toUpperCase()}</Text>
    </View>
  );
}

export function RestaurantRow({ restaurant, onPress, divider }: RestaurantRowProps) {
  return (
    <ListRow
      flush
      title={restaurant.name}
      subtitle={restaurantMeta(restaurant)}
      leading={<Monogram name={restaurant.name} />}
      trailing={
        <View style={styles.logos}>
          {restaurant.providerIds.map((id) => (
            <ProviderLogo key={id} providerId={id} size={24} decorative />
          ))}
        </View>
      }
      accessibilityLabel={`${restaurant.name}, ${restaurantMeta(restaurant)}, on ${restaurant.providerIds.length} apps`}
      divider={divider}
      onPress={onPress}
    />
  );
}

const styles = StyleSheet.create({
  monogram: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logos: {
    flexDirection: 'row',
    gap: 4,
  },
});
