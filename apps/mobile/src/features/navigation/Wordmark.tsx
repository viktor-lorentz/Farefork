import { APP_NAME } from '@repo/shared/brand';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/design/components';
import { useTheme } from '@/design/theme';
import { space, typeScale } from '@/design/tokens';

type WordmarkVariant = 'brand' | 'brandM' | 'brandS';

export type WordmarkProps = {
  variant?: WordmarkVariant;
  color?: string;
};

export function Wordmark({ variant = 'brandS', color }: WordmarkProps) {
  const { colors } = useTheme();
  const size = typeScale[variant].fontSize;
  const dot = Math.round(size * 0.24);
  return (
    <View style={styles.row} accessible accessibilityRole="header" accessibilityLabel={APP_NAME}>
      <Text variant={variant} style={color !== undefined ? { color } : null}>
        {APP_NAME.toLowerCase()}
      </Text>
      <View
        style={[
          styles.dot,
          {
            width: dot,
            height: dot,
            borderRadius: dot / 2,
            backgroundColor: colors.accent,
            marginBottom: Math.round(size * 0.22),
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  dot: {
    marginLeft: space.xxs / 2,
  },
});
