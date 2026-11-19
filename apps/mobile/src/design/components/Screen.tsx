import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { layout, space } from '../tokens/spacing';
import { useBreakpoint } from '../layout';

export type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  padTop?: boolean;
  padBottom?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  maxWidth?: number;
};

export function Screen({
  children,
  scroll = true,
  padTop = true,
  padBottom = false,
  contentStyle,
  maxWidth = layout.contentMaxWidth,
}: ScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const breakpoint = useBreakpoint();
  const gutter = breakpoint === 'compact' ? layout.gutter : layout.gutterWide;
  const inner: StyleProp<ViewStyle> = [
    styles.inner,
    {
      paddingHorizontal: gutter,
      paddingTop: (padTop ? insets.top : 0) + space.md,
      paddingBottom: (padBottom ? insets.bottom : 0) + space.xxxl,
      maxWidth,
    },
    contentStyle,
  ];

  if (!scroll) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[inner, styles.fill]}>{children}</View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      contentInsetAdjustmentBehavior="never"
    >
      <View style={inner}>{children}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  fill: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
  },
  inner: {
    width: '100%',
    alignSelf: 'center',
  },
});
