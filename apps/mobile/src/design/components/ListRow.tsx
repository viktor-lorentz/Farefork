import { useState, type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type AccessibilityRole,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { CaretRightIcon, type Icon } from '../icons';
import { useTheme } from '../theme';
import { iconSize, radius, space } from '../tokens/spacing';
import { Divider } from './Divider';
import { Text } from './Text';

const LEADING_SIZE = 40;

export type ListRowProps = {
  title: string;
  subtitle?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  value?: string;
  chevron?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  divider?: boolean;
  flush?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: AccessibilityRole;
  style?: StyleProp<ViewStyle>;
};

export function ListRow({
  title,
  subtitle,
  leading,
  trailing,
  value,
  chevron = false,
  onPress,
  disabled = false,
  destructive = false,
  divider = false,
  flush = false,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole,
  style,
}: ListRowProps) {
  const { colors } = useTheme();
  const [hovered, setHovered] = useState(false);

  const content = (
    <>
      {leading !== undefined ? <View style={styles.leading}>{leading}</View> : null}
      <View style={styles.body}>
        <Text variant="bodyStrong" tone={destructive ? 'danger' : 'primary'} numberOfLines={1}>
          {title}
        </Text>
        {subtitle !== undefined ? (
          <Text variant="caption" tone="secondary" numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {value !== undefined ? (
        <Text variant="label" tone="secondary" numberOfLines={1} style={styles.value}>
          {value}
        </Text>
      ) : null}
      {trailing}
      {chevron ? <CaretRightIcon size={iconSize.md} color={colors.textTertiary} /> : null}
    </>
  );

  const label = accessibilityLabel ?? [title, subtitle, value].filter(Boolean).join(', ');

  return (
    <View style={style}>
      {onPress ? (
        <Pressable
          accessibilityRole={accessibilityRole ?? 'button'}
          accessibilityLabel={label}
          accessibilityHint={accessibilityHint}
          accessibilityState={{ disabled }}
          disabled={disabled}
          onPress={onPress}
          onHoverIn={() => {
            setHovered(true);
          }}
          onHoverOut={() => {
            setHovered(false);
          }}
          style={({ pressed }) => [
            styles.row,
            flush && styles.flush,
            (pressed || hovered) && { backgroundColor: colors.pressed },
            disabled && styles.disabled,
          ]}
        >
          {content}
        </Pressable>
      ) : (
        <View accessible accessibilityLabel={label} style={[styles.row, flush && styles.flush]}>
          {content}
        </View>
      )}
      {divider ? (
        <Divider
          inset={(flush ? 0 : space.md) + (leading !== undefined ? LEADING_SIZE + space.md : 0)}
        />
      ) : null}
    </View>
  );
}

export function ListRowIcon({ icon: Glyph, accent = false }: { icon: Icon; accent?: boolean }) {
  const { colors } = useTheme();
  return (
    <View
      style={[styles.iconTile, { backgroundColor: accent ? colors.accent : colors.fill }]}
      importantForAccessibility="no-hide-descendants"
    >
      <Glyph size={iconSize.md} color={accent ? colors.onAccent : colors.textPrimary} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: 64,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  leading: {
    width: LEADING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: 2,
  },
  value: {
    maxWidth: '40%',
  },
  flush: {
    paddingHorizontal: 0,
  },
  disabled: {
    opacity: 0.4,
  },
  iconTile: {
    width: LEADING_SIZE,
    height: LEADING_SIZE,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
