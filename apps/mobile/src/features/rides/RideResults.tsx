import {
  formatMiles,
  formatMinutes,
  formatUsd,
  providerName,
  rideClasses,
  rideClassLabels,
  type RideQuote,
  type RideQuotesResponse,
} from '@repo/shared';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import {
  Button,
  Chip,
  EmptyState,
  IconButton,
  QuoteCard,
  QuoteCardSkeleton,
  QuoteCardUnavailable,
  SegmentedControl,
  Text,
  type QuoteCardNote,
  type SegmentOption,
} from '@/design/components';
import {
  ArrowsClockwiseIcon,
  ArrowSquareOutIcon,
  CarIcon,
  InfoIcon,
  SteeringWheelIcon,
  WarningCircleIcon,
} from '@/design/icons';
import { useTheme } from '@/design/theme';
import { layout, space } from '@/design/tokens';
import { ApiError } from '@/lib/api';
import { haptics } from '@/lib/haptics';
import { ProviderLogo } from '@/features/providers/ProviderLogo';
import { useTrip } from '@/stores/trip';
import { bookingLabel, openBooking } from './openBooking';
import {
  arrivalMinutes,
  cheapestQuoteId,
  classesPresent,
  filterQuotes,
  providerSpreadCents,
  sortQuotes,
  type QuoteSort,
} from './quoteSorting';
import { TripSummary } from './TripSummary';
import { useResultsView } from './useResultsView';
import { useRideQuotes } from './useRideQuotes';

const sortOptions: readonly SegmentOption<QuoteSort>[] = [
  { value: 'price', label: 'Cheapest' },
  { value: 'time', label: 'Fastest' },
];

function clockTime(base: Date, addMinutes: number): string {
  return new Date(base.getTime() + addMinutes * 60_000).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function quoteNote(quote: RideQuote): QuoteCardNote | undefined {
  if (quote.autonomous) {
    return {
      icon: SteeringWheelIcon,
      text:
        quote.bookVia !== quote.providerId
          ? `Driverless, booked in ${providerName(quote.bookVia)}`
          : 'Driverless',
    };
  }
  return undefined;
}

function errorCopy(error: Error): { title: string; body: string; retry: boolean } {
  if (error instanceof ApiError && error.status === 422) {
    return { title: 'Can’t price this trip', body: error.message, retry: false };
  }
  if (error instanceof ApiError && error.status === null) {
    return {
      title: 'Can’t reach the server',
      body: 'Check your connection, and that the API is running on your computer.',
      retry: true,
    };
  }
  return { title: 'Prices didn’t load', body: 'Something went wrong. Try again.', retry: true };
}

function QuoteError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const copy = errorCopy(error);
  return (
    <EmptyState
      icon={WarningCircleIcon}
      title={copy.title}
      body={copy.body}
      action={copy.retry ? { label: 'Try again', onPress: onRetry } : undefined}
    />
  );
}

export type VisibleQuotes = {
  data: RideQuotesResponse | undefined;
  visible: RideQuote[];
  selected: RideQuote | null;
  bestId: string | null;
};

export function useVisibleQuotes(): VisibleQuotes {
  const pickup = useTrip((state) => state.pickup);
  const dropoff = useTrip((state) => state.dropoff);
  const { data } = useRideQuotes(pickup, dropoff);
  const sort = useResultsView((state) => state.sort);
  const filter = useResultsView((state) => state.filter);
  const selectedId = useResultsView((state) => state.selectedId);
  const all = data?.quotes ?? [];
  const visible = sortQuotes(filterQuotes(all, filter), sort);
  const bestId = cheapestQuoteId(all);
  const selected =
    visible.find((quote) => quote.id === selectedId) ??
    visible.find((quote) => quote.id === cheapestQuoteId(visible)) ??
    null;
  return { data, visible, selected, bestId };
}

export function RideBookingBar() {
  const { selected } = useVisibleQuotes();
  const { colors } = useTheme();
  if (!selected) {
    return null;
  }
  return (
    <View style={[styles.bookingBar, { borderTopColor: colors.border }]}>
      <Button
        label={`${bookingLabel(selected)} · ${formatUsd(selected.priceCents)}`}
        trailingIcon={ArrowSquareOutIcon}
        fullWidth
        haptic={false}
        accessibilityHint={`Opens ${providerName(selected.bookVia)} with your pickup and destination filled in`}
        onPress={() => {
          void openBooking(selected);
        }}
      />
    </View>
  );
}

export function RideResults() {
  const router = useRouter();
  const pickup = useTrip((state) => state.pickup);
  const dropoff = useTrip((state) => state.dropoff);
  const clearTrip = useTrip((state) => state.clearTrip);
  const query = useRideQuotes(pickup, dropoff);
  const sort = useResultsView((state) => state.sort);
  const filter = useResultsView((state) => state.filter);
  const setSort = useResultsView((state) => state.setSort);
  const setFilter = useResultsView((state) => state.setFilter);
  const select = useResultsView((state) => state.select);
  const { data, visible, selected, bestId } = useVisibleQuotes();
  const { colors } = useTheme();

  if (!pickup || !dropoff) {
    return null;
  }

  const present = classesPresent(data?.quotes ?? []);
  const spread = providerSpreadCents(visible.filter((quote) => quote.rideClass === 'economy'));
  const generatedAt = data ? new Date(data.generatedAt) : new Date();

  return (
    <View style={styles.container}>
      <TripSummary
        pickup={pickup}
        dropoff={dropoff}
        onEdit={() => {
          router.push('/rides/search');
        }}
        onClear={() => {
          clearTrip();
        }}
      />

      {data ? (
        <View style={styles.routeRow}>
          <Text variant="caption" tone="secondary" tabular>
            {formatMiles(data.route.distanceMeters)} ·{' '}
            {formatMinutes(data.route.durationSeconds / 60)} drive
            {data.route.source === 'estimate' ? ' (estimated)' : ''}
          </Text>
          <IconButton
            icon={ArrowsClockwiseIcon}
            accessibilityLabel="Refresh prices"
            size={36}
            disabled={query.isFetching}
            onPress={() => {
              haptics.light();
              void query.refetch();
            }}
          />
        </View>
      ) : null}

      <SegmentedControl
        options={sortOptions}
        value={sort}
        onChange={setSort}
        accessibilityLabel="Sort rides"
      />

      {present.size > 1 ? (
        <View style={styles.chips} accessibilityRole="radiogroup">
          <Chip
            label="All"
            role="radio"
            selected={filter === 'all'}
            onPress={() => {
              setFilter('all');
            }}
          />
          {rideClasses
            .filter((rideClass) => present.has(rideClass))
            .map((rideClass) => (
              <Chip
                key={rideClass}
                label={rideClassLabels[rideClass]}
                role="radio"
                selected={filter === rideClass}
                onPress={() => {
                  setFilter(rideClass);
                }}
              />
            ))}
        </View>
      ) : null}

      {query.isPending ? (
        <View accessibilityLabel="Loading prices" accessibilityLiveRegion="polite">
          <QuoteCardSkeleton />
          <QuoteCardSkeleton />
          <QuoteCardSkeleton />
          <QuoteCardSkeleton />
        </View>
      ) : query.isError && !data ? (
        <QuoteError
          error={query.error}
          onRetry={() => {
            void query.refetch();
          }}
        />
      ) : data ? (
        <>
          {spread > 0 ? (
            <Text variant="caption" tone="secondary">
              Economy rides differ by up to{' '}
              <Text variant="captionStrong" tabular>
                {formatUsd(spread)}
              </Text>{' '}
              between apps for this trip.
            </Text>
          ) : null}
          {visible.length > 0 ? (
            <View accessibilityLabel={`${visible.length} ride options`}>
              {visible.map((quote) => (
                <QuoteCard
                  key={quote.id}
                  logo={<ProviderLogo providerId={quote.providerId} size={40} decorative />}
                  title={quote.productName}
                  meta={`${quote.seats} seats`}
                  detail={`${quote.pickupEtaMinutes} min away · arrive ${clockTime(generatedAt, arrivalMinutes(quote))}`}
                  priceCents={quote.priceCents}
                  bestPrice={quote.id === bestId}
                  surgeLabel={
                    quote.surgeMultiplier > 1
                      ? `Busy, ${quote.surgeMultiplier.toFixed(1)}×`
                      : undefined
                  }
                  note={quoteNote(quote)}
                  selected={quote.id === selected?.id}
                  accessibilityHint={`Select ${providerName(quote.providerId)} ${quote.productName}`}
                  onPress={() => {
                    haptics.selection();
                    select(quote.id);
                  }}
                />
              ))}
            </View>
          ) : (
            <EmptyState
              icon={CarIcon}
              title="No rides in this class"
              body="Try another ride type."
              action={{
                label: 'Show all',
                onPress: () => {
                  setFilter('all');
                },
              }}
            />
          )}
          {data.unavailable.map((entry) => (
            <QuoteCardUnavailable
              key={entry.providerId}
              logo={<ProviderLogo providerId={entry.providerId} size={40} decorative />}
              title={providerName(entry.providerId)}
              reason={entry.reason}
            />
          ))}
          <View style={styles.footnote}>
            <InfoIcon size={16} color={colors.textSecondary} weight="bold" />
            <Text variant="caption" tone="secondary" style={styles.footnoteText}>
              Simulated prices, updated {clockTime(generatedAt, 0)}. The app you book in sets the
              final price.
            </Text>
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: space.md,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: -space.xs,
    marginBottom: -space.xs,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.xs,
  },
  footnote: {
    flexDirection: 'row',
    gap: space.xs,
    alignItems: 'flex-start',
    paddingTop: space.xs,
  },
  footnoteText: {
    flex: 1,
  },
  bookingBar: {
    paddingHorizontal: layout.gutter,
    paddingTop: space.sm,
    paddingBottom: space.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
