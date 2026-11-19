import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton, Sheet, SheetScrollView } from '@/design/components';
import { CrosshairIcon } from '@/design/icons';
import { useIsDesktopLayout } from '@/design/layout';
import { useTheme } from '@/design/theme';
import { layout, space } from '@/design/tokens';
import { HomePanel } from '@/features/home/HomePanel';
import { MapCanvas } from '@/features/map/MapCanvas';
import { defaultCenter } from '@/features/map/types';

const SHEET_PEEK = 380;

export default function HomeScreen() {
  const desktop = useIsDesktopLayout();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  if (desktop) {
    return (
      <View style={[styles.desktop, { backgroundColor: colors.background }]}>
        <View style={styles.desktopMap}>
          <MapCanvas center={defaultCenter} />
        </View>
        <ScrollView
          style={[
            styles.desktopPanel,
            { borderLeftColor: colors.border, backgroundColor: colors.background },
          ]}
          contentContainerStyle={styles.desktopPanelContent}
        >
          <HomePanel />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.mobile, { backgroundColor: colors.background }]}>
      <MapCanvas
        center={defaultCenter}
        insets={{ top: insets.top, bottom: SHEET_PEEK - 40 }}
        showsUserLocation
      />
      <View style={[styles.mapControls, { top: insets.top + space.sm }]}>
        <IconButton
          icon={CrosshairIcon}
          accessibilityLabel="Center on my location"
          variant="raised"
        />
      </View>
      <Sheet snapPoints={[SHEET_PEEK, '88%']} topInset={insets.top}>
        <SheetScrollView contentContainerStyle={styles.sheetContent}>
          <HomePanel />
        </SheetScrollView>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  mobile: {
    flex: 1,
  },
  mapControls: {
    position: 'absolute',
    right: layout.gutter,
  },
  sheetContent: {
    paddingHorizontal: layout.gutter,
    paddingTop: space.xs,
    paddingBottom: space.xxl,
  },
  desktop: {
    flex: 1,
    flexDirection: 'row',
  },
  desktopMap: {
    flex: 1,
  },
  desktopPanel: {
    width: layout.panelWidth,
    flexGrow: 0,
    borderLeftWidth: StyleSheet.hairlineWidth,
  },
  desktopPanelContent: {
    padding: layout.gutterWide - space.xs,
  },
});
