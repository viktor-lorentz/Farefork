import { useState, type ComponentRef, type ReactNode, type Ref } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { haptics } from '@/lib/haptics';
import { MagnifyingGlassIcon, XCircleIcon, type Icon } from '../icons';
import { useTheme } from '../theme';
import { controlHeight, iconSize, radius, space } from '../tokens/spacing';
import { fontFamilies, fontSize } from '../tokens/typography';
import { Text } from './Text';

export type SearchFieldProps = Omit<TextInputProps, 'style'> & {
  icon?: Icon | null;
  leading?: ReactNode;
  trailing?: ReactNode;
  size?: 'md' | 'lg';
  variant?: 'filled' | 'bare';
  onClear?: () => void;
  clearLabel?: string;
  style?: StyleProp<ViewStyle>;
  ref?: Ref<ComponentRef<typeof TextInput>>;
};

export function SearchField({
  icon: Glyph = MagnifyingGlassIcon,
  leading,
  trailing,
  size = 'lg',
  variant = 'filled',
  onClear,
  clearLabel = 'Clear',
  style,
  onFocus,
  onBlur,
  ref,
  ...inputProps
}: SearchFieldProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const hasText = (inputProps.value ?? '').length > 0;
  const filled = variant === 'filled';

  return (
    <View
      style={[
        styles.container,
        { height: size === 'lg' ? controlHeight.lg : controlHeight.md },
        filled && {
          backgroundColor: focused ? colors.surface : colors.fill,
          borderColor: focused ? colors.focus : colors.border,
          boxShadow: focused ? `0 0 0 3px ${colors.accentSoft}` : undefined,
        },
        filled ? styles.filled : styles.bare,
        style,
      ]}
    >
      {leading ?? (Glyph ? <Glyph size={iconSize.md} color={colors.textSecondary} /> : null)}
      <TextInput
        ref={ref}
        placeholderTextColor={colors.textTertiary}
        selectionColor={colors.accent}
        cursorColor={colors.textPrimary}
        maxFontSizeMultiplier={1.4}
        {...inputProps}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        style={[styles.input, { color: colors.textPrimary }]}
      />
      {onClear && hasText ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={clearLabel}
          hitSlop={space.sm}
          onPress={() => {
            haptics.selection();
            onClear();
          }}
          style={styles.clear}
        >
          <XCircleIcon size={iconSize.md} color={colors.textTertiary} />
        </Pressable>
      ) : null}
      {trailing}
    </View>
  );
}

export type SearchButtonProps = {
  label: string;
  onPress: () => void;
  icon?: Icon;
  trailing?: ReactNode;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
};

export function SearchButton({
  label,
  onPress,
  icon: Glyph = MagnifyingGlassIcon,
  trailing,
  accessibilityHint,
  style,
}: SearchButtonProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="search"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      onPress={() => {
        haptics.light();
        onPress();
      }}
      style={({ pressed }) => [
        styles.container,
        styles.filled,
        styles.button,
        {
          backgroundColor: pressed ? colors.fillStrong : colors.fill,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      <Glyph size={iconSize.lg} color={colors.textPrimary} weight="bold" />
      <Text variant="titleS" numberOfLines={1} style={styles.buttonLabel}>
        {label}
      </Text>
      {trailing}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  filled: {
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
  },
  bare: {
    paddingHorizontal: space.none,
  },
  button: {
    height: controlHeight.lg,
  },
  buttonLabel: {
    flex: 1,
  },
  clear: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: iconSize.lg,
  },
  input: {
    flex: 1,
    height: '100%',
    fontFamily: fontFamilies.system,
    fontSize: fontSize.headline,
    outlineWidth: 0,
  },
});
