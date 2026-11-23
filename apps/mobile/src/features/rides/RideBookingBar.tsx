import { formatUsd, providerName, type RideQuote } from '@repo/shared';
import * as Linking from 'expo-linking';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AdaptiveGlass, Button, Text } from '@/design/components';
import { ArrowSquareOutIcon, PhoneIcon } from '@/design/icons';
import { useIsDesktopLayout } from '@/design/layout';
import { useTheme } from '@/design/theme';
import { controlHeight, iconSize, layout, radius, space } from '@/design/tokens';
import { rememberHandoff } from '@/features/account/queries';
import { rideHandoff } from '@/features/account/savings';
import { useTrip } from '@/stores/trip';
import { bookingLabel, canBookHere, openBooking } from './openBooking';
import { QrCode } from './QrCode';
import { useVisibleQuotes } from './useVisibleQuotes';

const QR_SIZE = space.huge + space.xl;

export const BOOKING_BAR_SPACE = controlHeight.lg + space.xs * 2 + space.sm;

function PhoneHandoff({ quote }: { quote: RideQuote }) {
  const { colors } = useTheme();
  const desktop = useIsDesktopLayout();
  const provider = providerName(quote.bookVia);
  return (
    <View style={styles.handoff}>
      {desktop ? (
        <QrCode value={Linking.createURL('/')} size={QR_SIZE} />
      ) : (
        <View style={[styles.phoneIcon, { backgroundColor: colors.fill }]}>
          <PhoneIcon size={iconSize.md} color={colors.textPrimary} weight="bold" />
        </View>
      )}
      <View style={styles.handoffText}>
        <Text variant="labelStrong">Get Farefork on your phone to book</Text>
        <Text variant="caption" tone="secondary">
          {provider} only takes ride requests in its app.{' '}
          {desktop ? 'Scan to open Farefork' : 'Open Farefork on your phone'} and your route carries
          over.
        </Text>
      </View>
    </View>
  );
}

export function RideBookingBar() {
  const { selected, data } = useVisibleQuotes();
  const pickup = useTrip((state) => state.pickup);
  const dropoff = useTrip((state) => state.dropoff);
  const insets = useSafeAreaInsets();
  if (!selected) {
    return null;
  }
  const bookable = canBookHere(selected);
  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, space.sm) }]}>
      <AdaptiveGlass interactive style={styles.bar}>
        {bookable ? (
          <Button
            label={`${bookingLabel(selected)} · ${formatUsd(selected.priceCents)}`}
            trailingIcon={ArrowSquareOutIcon}
            fullWidth
            haptic={false}
            accessibilityHint={`Opens ${providerName(selected.bookVia)} with your pickup and destination filled in. Price before tip.`}
            onPress={() => {
              void openBooking(selected).then((opened) => {
                if (opened && data && pickup && dropoff) {
                  rememberHandoff(
                    rideHandoff(selected, data.quotes, { from: pickup.name, to: dropoff.name }),
                    providerName(selected.bookVia),
                  );
                }
              });
            }}
          />
        ) : (
          <PhoneHandoff quote={selected} />
        )}
      </AdaptiveGlass>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: layout.gutter,
    paddingTop: space.xs,
  },
  bar: {
    padding: space.xs,
    borderRadius: radius.lg + space.xs,
    borderCurve: 'continuous',
  },
  handoff: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    padding: space.xs,
  },
  phoneIcon: {
    width: controlHeight.md - space.xxs,
    height: controlHeight.md - space.xxs,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  handoffText: {
    flex: 1,
    gap: space.xxs / 2,
  },
});
