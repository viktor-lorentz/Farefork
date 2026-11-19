import { create } from 'zustand';
import type { ClassFilter, QuoteSort } from './quoteSorting';

type ResultsViewState = {
  sort: QuoteSort;
  filter: ClassFilter;
  selectedId: string | null;
  setSort: (sort: QuoteSort) => void;
  setFilter: (filter: ClassFilter) => void;
  select: (quoteId: string | null) => void;
  reset: () => void;
};

export const useResultsView = create<ResultsViewState>()((set) => ({
  sort: 'price',
  filter: 'all',
  selectedId: null,
  setSort: (sort) => {
    set({ sort });
  },
  setFilter: (filter) => {
    set({ filter, selectedId: null });
  },
  select: (selectedId) => {
    set({ selectedId });
  },
  reset: () => {
    set({ sort: 'price', filter: 'all', selectedId: null });
  },
}));
