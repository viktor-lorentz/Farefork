import {
  formatMiles,
  formatMinutes,
  formatUsd,
  providerName,
  rideClassLabels,
  type RideQuote,
} from '@repo/shared';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Button,
  Divider,
  EmptyState,
  IconButton,
  QUOTE_LOGO_SIZE,
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
  BellRingingIcon,
  CarIcon,
  InfoIcon,
  SealCheckIcon,
  SteeringWheelIcon,
  WarningCircleIcon,
} from '@/design/icons';
import { useTheme } from '@/design/theme';
import { controlHeight, iconSize, space } from '@/design/tokens';
import { duration } from '@/design/tokens/motion';
import { ApiError } from '@/lib/api';
import { haptics } from '@/lib/haptics';
import { FavoriteButton } from '@/features/account/FavoriteButton';
import { routeFavorite } from '@/features/account/favorites';
import { ProviderLogo } from '@/features/providers/ProviderLogo';
import { CarLoader } from '@/features/scene/CarLoader';
import { isCurrentLocation, useTrip } from '@/stores/trip';
import { ClassChips } from './ClassChips';
import {
  arrivalMinutes,
  classesPresent,
  providerSpreadCents,
  savingsVersusRival,
  type ClassFilter,
  type QuoteSort,
} from './quoteSorting';
import { TripSummary } from './TripSummary';
import { UpdatedAgo } from './UpdatedAgo';
import { useResultsView } from './useResultsView';
import { useRideQuotes } from './useRideQuotes';
import { useVisibleQuotes } from './useVisibleQuotes';
import { WinnerCard } from './WinnerCard';

const CASCADE_STEP_MS = 40;

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
  if (quote.membershipNote !== null) {
    return { icon: SealCheckIcon, text: quote.membershipNote };
  }
  return undefined;
}

function surgeLabel(quote: RideQuote): string | undefined {
  return quote.surgeMultiplier > 1 ? `Busy ${quote.surgeMultiplier.toFixed(1)}×` : undefined;
}

function quoteDetail(quote: RideQuote, generatedAt: Date): string {
  return `${quote.pickupEtaMinutes} min away · arrive ${clockTime(generatedAt, arrivalMinutes(quote))}`;
}

function winnerChip(
  winner: RideQuote,
  bestId: string | null,
  sort: QuoteSort,
  filter: ClassFilter,
) {
  if (sort === 'time') {
    return 'Fastest';
  }
  if (winner.id === bestId || filter === 'all') {
    return 'Best price';
  }
  return `Cheapest ${rideClassLabels[filter]}`;
}

function errorCopy(error: Error): { title: string; body: string; retry: boolean } {
  if (error instanceof ApiError && error.status === 422) {
    return { title: 'Can’t price this trip', body: error.message, retry: false };
  }
  if (error instanceof ApiError && error.status === null) {
    return {
      title: 'You’re offline',
      body: 'Farefork can’t reach the price server. Check your connection and try again.',
      retry: true,
    };
  }
  return {
    title: 'Prices didn’t load',
    body: 'Something went wrong on our end. Try again.',
    retry: true,
  };
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

function LoadingQuotes() {
  return (
    <View accessibilityLabel="Comparing prices" accessibilityLiveRegion="polite">
      <CarLoader label="Comparing prices across apps" />
      <QuoteCardSkeleton />
      <QuoteCardSkeleton />
      <QuoteCardSkeleton />
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
  const cheapestCents =
    data && data.quotes.length > 0
      ? Math.min(...data.quotes.map((quote) => quote.priceCents))
      : null;
  const [winner, ...others] = visible;
  const choose = (quote: RideQuote) => {
    haptics.selection();
    select(quote.id);
  };

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
        trailing={
          <FavoriteButton favorite={routeFavorite(pickup, dropoff, isCurrentLocation(pickup))} />
        }
      />

      {data ? (
        <View style={styles.routeRow}>
          <View style={styles.routeText}>
            <Text variant="caption" tone="secondary" tabular numberOfLines={1}>
              {formatMiles(data.route.distanceMeters)} ·{' '}
              {formatMinutes(data.route.durationSeconds / 60)} drive
              {data.route.source === 'estimate' ? ' (estimated)' : ''} · prices before tip
            </Text>
            <UpdatedAgo since={generatedAt} />
          </View>
          <IconButton
            icon={ArrowsClockwiseIcon}
            accessibilityLabel="Refresh prices"
            size={controlHeight.md}
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
        <ClassChips present={present} value={filter} onChange={setFilter} />
      ) : null}

      {query.isPending ? (
        <LoadingQuotes />
      ) : query.isError && !data ? (
        <QuoteError
          error={query.error}
          onRetry={() => {
            void query.refetch();
          }}
        />
      ) : data ? (
        <>
          {winner !== undefined ? (
            <WinnerCard
              key={winner.id}
              quote={winner}
              chip={winnerChip(winner, bestId, sort, filter)}
              detail={quoteDetail(winner, generatedAt)}
              savings={savingsVersusRival(winner, data.quotes)}
              surgeLabel={surgeLabel(winner)}
              note={quoteNote(winner)}
              selected={winner.id === selected?.id}
              onPress={() => {
                choose(winner);
              }}
            />
          ) : (
            <EmptyState
              icon={CarIcon}
              title="No rides in this class"
              body="Nothing’s available in this class right now. Try another ride type."
              action={{
                label: 'Show all rides',
                onPress: () => {
                  setFilter('all');
                },
              }}
            />
          )}
          {others.length > 0 ? (
            <View accessibilityLabel={`${others.length} more ride options`}>
              {others.map((quote, index) => (
                <Animated.View
                  key={quote.id}
                  entering={FadeInDown.duration(duration.base).delay(index * CASCADE_STEP_MS)}
                >
                  {index > 0 ? <Divider inset={QUOTE_LOGO_SIZE + space.sm * 2} /> : null}
                  <QuoteCard
                    logo={
                      <ProviderLogo
                        providerId={quote.providerId}
                        size={QUOTE_LOGO_SIZE}
                        decorative
                      />
                    }
                    title={quote.productName}
                    meta={`${quote.seats} seats`}
                    detail={quoteDetail(quote, generatedAt)}
                    priceCents={quote.priceCents}
                    originalPriceCents={quote.standardPriceCents}
                    surgeLabel={surgeLabel(quote)}
                    note={quoteNote(quote)}
                    selected={quote.id === selected?.id}
                    accessibilityHint={`Select ${providerName(quote.providerId)} ${quote.productName}`}
                    onPress={() => {
                      choose(quote);
                    }}
                  />
                </Animated.View>
              ))}
            </View>
          ) : null}
          {data.unavailable.map((entry) => (
            <QuoteCardUnavailable
              key={entry.providerId}
              logo={
                <ProviderLogo providerId={entry.providerId} size={QUOTE_LOGO_SIZE} decorative />
              }
              title={providerName(entry.providerId)}
              reason={entry.reason}
            />
          ))}
          {spread > 0 ? (
            <Text variant="caption" tone="secondary">
              Economy rides differ by up to{' '}
              <Text variant="captionStrong" tabular>
                {formatUsd(spread)}
              </Text>{' '}
              between apps for this trip.
            </Text>
          ) : null}
          {cheapestCents !== null ? (
            <Button
              label="Alert me when it drops"
              variant="secondary"
              leadingIcon={BellRingingIcon}
              fullWidth
              onPress={() => {
                router.push({
                  pathname: '/alerts/new',
                  params: { cheapest: String(cheapestCents) },
                });
              }}
            />
          ) : null}
          <View style={styles.footnote}>
            <InfoIcon size={iconSize.sm} color={colors.textTertiary} weight="bold" />
            <Text variant="caption" tone="tertiary" style={styles.footnoteText}>
              Simulated prices before tip. The app you book in sets the final price, and opens with
              your pickup and destination filled in.
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
    gap: space.sm,
    marginVertical: -space.xs,
  },
  routeText: {
    flex: 1,
    gap: space.xxs / 2,
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
});
