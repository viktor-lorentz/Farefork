import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/design/theme';
import { layout, space } from '@/design/tokens';

export function BottomBar({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.bar,
        {
          borderTopColor: colors.border,
          backgroundColor: colors.background,
          paddingBottom: insets.bottom + space.sm,
        },
      ]}
    >
      <View style={styles.inner}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: space.sm,
    paddingHorizontal: layout.gutter,
  },
  inner: {
    width: '100%',
    maxWidth: layout.contentMaxWidth - layout.gutterWide * 2,
    alignSelf: 'center',
    gap: space.xs,
  },
});
