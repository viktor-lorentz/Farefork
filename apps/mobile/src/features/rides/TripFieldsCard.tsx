import type { ComponentRef, RefObject } from 'react';
import { StyleSheet, View, type TextInput } from 'react-native';
import { Divider, IconButton, SearchField } from '@/design/components';
import { ArrowsDownUpIcon } from '@/design/icons';
import { useTheme } from '@/design/theme';
import { controlHeight, radius, space } from '@/design/tokens';

export type TripField = 'pickup' | 'dropoff';

type InputRef = RefObject<ComponentRef<typeof TextInput> | null>;

export type TripFieldsCardProps = {
  pickupText: string;
  dropoffText: string;
  focused: TripField;
  autoFocus: TripField;
  pickupRef: InputRef;
  dropoffRef: InputRef;
  onChange: (field: TripField, text: string) => void;
  onFocus: (field: TripField) => void;
  onClear: (field: TripField) => void;
  onSwap: () => void;
};

const MARKER = space.sm - space.xxs / 2;

function Marker({ shape, active }: { shape: 'dot' | 'square'; active: boolean }) {
  const { colors } = useTheme();
  const color = active ? colors.accent : colors.primary;
  return shape === 'dot' ? (
    <View style={[styles.dot, { borderColor: color }]} />
  ) : (
    <View style={[styles.square, { backgroundColor: color }]} />
  );
}

export function TripFieldsCard({
  pickupText,
  dropoffText,
  focused,
  autoFocus,
  pickupRef,
  dropoffRef,
  onChange,
  onFocus,
  onClear,
  onSwap,
}: TripFieldsCardProps) {
  const { colors, elevation } = useTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          boxShadow: elevation.raised,
        },
      ]}
    >
      <View style={styles.markers} importantForAccessibility="no-hide-descendants">
        <Marker shape="dot" active={focused === 'pickup'} />
        <View style={[styles.connector, { backgroundColor: colors.borderStrong }]} />
        <Marker shape="square" active={focused === 'dropoff'} />
      </View>
      <View style={styles.fields}>
        <SearchField
          ref={pickupRef}
          variant="bare"
          size="md"
          icon={null}
          value={pickupText}
          onChangeText={(text) => {
            onChange('pickup', text);
          }}
          onFocus={() => {
            onFocus('pickup');
          }}
          onClear={() => {
            onClear('pickup');
          }}
          clearLabel="Clear pickup"
          placeholder="Pickup location"
          autoFocus={autoFocus === 'pickup'}
          returnKeyType="search"
          autoCorrect={false}
          accessibilityLabel="Pickup"
        />
        <Divider />
        <SearchField
          ref={dropoffRef}
          variant="bare"
          size="md"
          icon={null}
          value={dropoffText}
          onChangeText={(text) => {
            onChange('dropoff', text);
          }}
          onFocus={() => {
            onFocus('dropoff');
          }}
          onClear={() => {
            onClear('dropoff');
          }}
          clearLabel="Clear destination"
          placeholder="Where to?"
          autoFocus={autoFocus === 'dropoff'}
          returnKeyType="search"
          autoCorrect={false}
          accessibilityLabel="Destination"
        />
      </View>
      <IconButton
        icon={ArrowsDownUpIcon}
        variant="filled"
        size={44}
        accessibilityLabel="Swap pickup and destination"
        onPress={onSwap}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingLeft: space.md,
    paddingRight: space.xs,
    paddingVertical: space.xxs,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
  },
  markers: {
    alignItems: 'center',
    height: controlHeight.md * 2,
    paddingVertical: controlHeight.md / 2 - MARKER / 2,
  },
  dot: {
    width: MARKER,
    height: MARKER,
    borderRadius: radius.round,
    borderWidth: 3,
  },
  square: {
    width: MARKER,
    height: MARKER,
    borderRadius: 2,
  },
  connector: {
    flex: 1,
    width: StyleSheet.hairlineWidth * 2,
    marginVertical: space.xxs,
  },
  fields: {
    flex: 1,
  },
});
