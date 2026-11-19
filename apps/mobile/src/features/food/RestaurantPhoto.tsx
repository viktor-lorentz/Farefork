import { cuisineLabels, type RestaurantSummary } from '@repo/shared';
import { useState } from 'react';
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Text } from '@/design/components';
import { useTheme } from '@/design/theme';
import { apiBaseUrl } from '@/lib/api';

export function RestaurantPhoto({
  restaurant,
  style,
}: {
  restaurant: Pick<RestaurantSummary, 'photo' | 'cuisine'>;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const [failed, setFailed] = useState(false);
  const photo = restaurant.photo;
  const uri = photo ? (photo.path !== null ? `${apiBaseUrl}${photo.path}` : photo.url) : null;
  return (
    <View
      style={[styles.frame, { backgroundColor: colors.fill }, style]}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      {uri !== null && !failed ? (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          onError={() => {
            setFailed(true);
          }}
        />
      ) : (
        <Text variant="labelStrong" tone="secondary">
          {cuisineLabels[restaurant.cuisine]}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
