import type { ReactNode } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeftIcon } from '../icons';
import { useBreakpoint } from '../layout';
import { useTheme } from '../theme';
import { layout, space } from '../tokens/spacing';
import { IconButton } from './IconButton';
import { Text } from './Text';

export type ScreenHeaderProps = {
  title?: string;
  large?: boolean;
  back?: boolean;
  padTop?: boolean;
  trailing?: ReactNode;
};

export function ScreenHeader({
  title,
  large = false,
  back = true,
  padTop = true,
  trailing,
}: ScreenHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const gutter = useBreakpoint() === 'compact' ? layout.gutter : layout.gutterWide;
  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: padTop ? insets.top : 0,
          paddingHorizontal: gutter - space.xs,
          backgroundColor: colors.background,
        },
      ]}
    >
      <View style={styles.bar}>
        {back ? (
          <IconButton
            icon={ArrowLeftIcon}
            accessibilityLabel="Back"
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/');
              }
            }}
          />
        ) : null}
        {!large && title !== undefined ? (
          <Text
            variant="titleS"
            accessibilityRole="header"
            numberOfLines={1}
            style={styles.inlineTitle}
          >
            {title}
          </Text>
        ) : (
          <View style={styles.spacer} />
        )}
        {trailing}
      </View>
      {large && title !== undefined ? (
        <Text variant="titleXL" accessibilityRole="header" style={styles.largeTitle}>
          {title}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  spacer: { flex: 1 },
  container: {
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xxs,
    minHeight: 52,
  },
  inlineTitle: {
    flex: 1,
  },
  largeTitle: {
    paddingHorizontal: space.xs,
    paddingBottom: space.xs,
  },
});
