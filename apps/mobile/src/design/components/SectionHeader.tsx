import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { space } from '../tokens/spacing';
import { Button } from './Button';
import { Text } from './Text';

export type SectionHeaderProps = {
  title: string;
  action?: { label: string; onPress: () => void };
  style?: StyleProp<ViewStyle>;
};

export function SectionHeader({ title, action, style }: SectionHeaderProps) {
  return (
    <View style={[styles.row, style]}>
      <Text variant="titleS" accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      {action ? (
        <Button
          label={action.label}
          onPress={action.onPress}
          variant="tertiary"
          size="sm"
          haptic={false}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 36,
    marginBottom: space.xxs,
  },
  title: {
    flex: 1,
  },
});
