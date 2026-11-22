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
import { MagnifyingGlassIcon, type Icon } from '../icons';
import { useTheme } from '../theme';
import { controlHeight, radius, space } from '../tokens/spacing';
import { fontFamilies } from '../tokens/typography';
import { Text } from './Text';

export type SearchFieldProps = Omit<TextInputProps, 'style'> & {
  icon?: Icon;
  trailing?: ReactNode;
  size?: 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
  ref?: Ref<ComponentRef<typeof TextInput>>;
};

export function SearchField({
  icon: Glyph = MagnifyingGlassIcon,
  trailing,
  size = 'lg',
  style,
  onFocus,
  onBlur,
  ref,
  ...inputProps
}: SearchFieldProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View
      style={[
        styles.container,
        {
          height: size === 'lg' ? controlHeight.lg : controlHeight.md,
          backgroundColor: colors.fill,
          borderColor: focused ? colors.focus : 'transparent',
        },
        style,
      ]}
    >
      <Glyph size={20} color={colors.textPrimary} weight="bold" />
      <TextInput
        ref={ref}
        placeholderTextColor={colors.textTertiary}
        selectionColor={colors.textPrimary}
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
        styles.button,
        { backgroundColor: pressed ? colors.fillStrong : colors.fill },
        style,
      ]}
    >
      <Glyph size={22} color={colors.textPrimary} weight="bold" />
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
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  button: {
    height: controlHeight.lg,
  },
  buttonLabel: {
    flex: 1,
  },
  input: {
    flex: 1,
    height: '100%',
    fontFamily: fontFamilies.system,
    fontSize: 17,
    outlineWidth: 0,
  },
});
