import { StyleSheet, View } from 'react-native';
import { space } from '../tokens/spacing';
import { Text } from './Text';

export type PageTitleProps = {
  title: string;
  meta?: string | null;
};

export function PageTitle({ title, meta }: PageTitleProps) {
  return (
    <View style={styles.container}>
      <Text variant="titleXL" accessibilityRole="header">
        {title}
      </Text>
      {meta ? (
        <Text variant="caption" tone="secondary" tabular>
          {meta}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: space.xxs / 2 },
});
