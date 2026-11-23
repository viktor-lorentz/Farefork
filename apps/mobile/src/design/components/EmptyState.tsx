import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { Icon } from '../icons';
import { useTheme } from '../theme';
import { iconSize, layout, space } from '../tokens/spacing';
import { Button } from './Button';
import { Text } from './Text';

const BADGE_SIZE = space.huge;

export type EmptyStateProps = {
  icon: Icon;
  title: string;
  body: string;
  action?: { label: string; onPress: () => void };
  style?: StyleProp<ViewStyle>;
};

export function EmptyState({ icon: Glyph, title, body, action, style }: EmptyStateProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, style]}>
      <View
        style={[styles.badge, { backgroundColor: colors.fill }]}
        importantForAccessibility="no-hide-descendants"
      >
        <Glyph size={iconSize.xl} color={colors.textSecondary} />
      </View>
      <View style={styles.copy}>
        <Text variant="titleS" accessibilityRole="header" style={styles.center}>
          {title}
        </Text>
        <Text variant="body" tone="secondary" style={styles.center}>
          {body}
        </Text>
      </View>
      {action ? (
        <Button label={action.label} onPress={action.onPress} variant="primary" size="md" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    alignSelf: 'center',
    gap: space.md,
    paddingVertical: space.xxl,
    paddingHorizontal: space.lg,
    maxWidth: layout.panelWidth,
    width: '100%',
  },
  badge: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    gap: space.xxs,
  },
  center: {
    textAlign: 'center',
  },
});
