import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { Icon } from '../icons';
import { useTheme } from '../theme';
import { iconSize, layout, space } from '../tokens/spacing';
import { Button } from './Button';
import { Text } from './Text';

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
    <View style={[styles.container, { borderColor: colors.border }, style]}>
      <View style={styles.titleRow}>
        <Glyph size={iconSize.md} color={colors.textSecondary} weight="bold" />
        <Text variant="bodyStrong" accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
      </View>
      <Text variant="body" tone="secondary">
        {body}
      </Text>
      {action ? (
        <View style={styles.action}>
          <Button label={action.label} onPress={action.onPress} variant="secondary" size="md" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: space.xs,
    paddingTop: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    maxWidth: layout.panelWidth,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  title: {
    flex: 1,
  },
  action: {
    alignItems: 'flex-start',
    paddingTop: space.xs,
  },
});
