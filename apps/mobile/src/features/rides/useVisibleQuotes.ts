import type { RideQuote, RideQuotesResponse } from '@repo/shared';
import { useTrip } from '@/stores/trip';
import { cheapestQuoteId, filterQuotes, sortQuotes } from './quoteSorting';
import { useResultsView } from './useResultsView';
import { useRideQuotes } from './useRideQuotes';

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
