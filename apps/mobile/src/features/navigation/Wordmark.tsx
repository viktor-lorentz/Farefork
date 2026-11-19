import { APP_NAME } from '@repo/shared/brand';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/design/components';
import { useTheme } from '@/design/theme';

export function Wordmark({ size = 22 }: { size?: number }) {
  const { colors } = useTheme();
  const dot = Math.round(size * 0.28);
  return (
    <View style={styles.row} accessible accessibilityRole="header" accessibilityLabel={APP_NAME}>
      <Text
        variant="titleM"
        style={{ fontSize: size, lineHeight: size * 1.15, letterSpacing: size * -0.04 }}
      >
        {APP_NAME.toLowerCase()}
      </Text>
      <View
        style={{
          width: dot,
          height: dot,
          borderRadius: dot / 2,
          backgroundColor: colors.accent,
          marginLeft: 2,
          marginBottom: size * 0.16,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
});
