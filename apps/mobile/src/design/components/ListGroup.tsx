import { Children, Fragment, isValidElement, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../theme';
import { radius, space } from '../tokens/spacing';
import { Text } from './Text';

export type ListGroupProps = {
  title?: string;
  footer?: string;
  inset?: number;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export const listGroupIconInset = space.md * 2 + space.xxl;

export function ListGroup({ title, footer, inset = space.md, children, style }: ListGroupProps) {
  const { colors } = useTheme();
  const rows = Children.toArray(children).filter(isValidElement);
  return (
    <View style={[styles.container, style]}>
      {title !== undefined ? (
        <Text variant="label" tone="secondary" accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
      ) : null}
      <View style={[styles.group, { backgroundColor: colors.surface }]}>
        {rows.map((row, index) => (
          <Fragment key={row.key ?? index}>
            {index > 0 ? (
              <View
                style={[styles.separator, { backgroundColor: colors.border, marginLeft: inset }]}
              />
            ) : null}
            {row}
          </Fragment>
        ))}
      </View>
      {footer !== undefined ? (
        <Text variant="caption" tone="secondary" style={styles.title}>
          {footer}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: space.xs,
  },
  title: {
    paddingHorizontal: space.md,
  },
  group: {
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
  },
});
