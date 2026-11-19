import { StyleSheet, View } from 'react-native';
import { useTheme } from '../theme';

export type DividerProps = {
  inset?: number;
};

export function Divider({ inset = 0 }: DividerProps) {
  const { colors } = useTheme();
  return (
    <View
      importantForAccessibility="no"
      style={[styles.line, { backgroundColor: colors.border, marginLeft: inset }]}
    />
  );
}

const styles = StyleSheet.create({
  line: {
    height: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
  },
});
