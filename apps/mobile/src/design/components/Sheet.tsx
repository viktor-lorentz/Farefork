import BottomSheet, {
  BottomSheetFooter,
  type BottomSheetFooterProps,
  type BottomSheetProps,
} from '@gorhom/bottom-sheet';
import { useCallback, type ReactNode, type Ref } from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from '../theme';
import { radius, space } from '../tokens/spacing';

export {
  BottomSheetFlatList as SheetFlatList,
  BottomSheetScrollView as SheetScrollView,
  BottomSheetView as SheetView,
} from '@gorhom/bottom-sheet';

export type SheetHandle = BottomSheet;

export type SheetProps = {
  snapPoints: (string | number)[];
  index?: number;
  onChange?: BottomSheetProps['onChange'];
  enablePanDownToClose?: boolean;
  topInset?: number;
  bottomInset?: number;
  children: ReactNode;
  footer?: ReactNode;
  tone?: 'surface' | 'background';
  accessibilityLabel?: string;
  ref?: Ref<BottomSheet>;
};

export function Sheet({
  snapPoints,
  index = 0,
  onChange,
  enablePanDownToClose = false,
  topInset = 0,
  bottomInset = 0,
  children,
  footer,
  tone = 'surface',
  accessibilityLabel = 'Results sheet',
  ref,
}: SheetProps) {
  const { colors, elevation } = useTheme();
  const renderFooter = useCallback(
    (props: BottomSheetFooterProps) => <BottomSheetFooter {...props}>{footer}</BottomSheetFooter>,
    [footer],
  );
  return (
    <BottomSheet
      ref={ref}
      index={index}
      snapPoints={snapPoints}
      onChange={onChange}
      enableDynamicSizing={false}
      enablePanDownToClose={enablePanDownToClose}
      topInset={topInset}
      bottomInset={bottomInset}
      style={[styles.container, { boxShadow: elevation.raised }]}
      backgroundStyle={[styles.background, { backgroundColor: colors[tone] }]}
      handleStyle={styles.handle}
      handleIndicatorStyle={[styles.indicator, { backgroundColor: colors.borderStrong }]}
      footerComponent={footer !== undefined && footer !== null ? renderFooter : undefined}
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  background: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  handle: {
    paddingTop: space.sm,
    paddingBottom: space.xxs,
  },
  indicator: {
    width: space.xl + space.xxs,
    height: space.xxs,
    borderRadius: radius.round,
  },
});
