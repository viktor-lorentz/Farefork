import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { Icon } from '../icons';
import { useTheme } from '../theme';
import { radius, space } from '../tokens/spacing';
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
    <View style={[styles.container, style]}>
      <View style={[styles.tile, { backgroundColor: colors.fill }]}>
        <Glyph size={28} color={colors.textPrimary} />
      </View>
      <View style={styles.copy}>
        <Text variant="titleS" accessibilityRole="header">
          {title}
        </Text>
        <Text variant="body" tone="secondary">
          {body}
        </Text>
      </View>
      {action ? (
        <Button label={action.label} onPress={action.onPress} variant="secondary" size="md" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: space.md,
    paddingVertical: space.xl,
    maxWidth: 420,
  },
  tile: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    gap: space.xxs,
  },
});
