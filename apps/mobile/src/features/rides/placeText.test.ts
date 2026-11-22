import type { Place } from '@repo/shared';
import { describe, expect, it } from 'vitest';
import { dedupePlaces, highlightSegments } from './placeText';

const place = (id: string, name: string, address: string): Place => ({
  id,
  name,
  address,
  latitude: 37.79,
  longitude: -122.39,
});

describe('dedupePlaces', () => {
  it('drops places with the same name and address', () => {
    const result = dedupePlaces([
      place('a', 'Ferry Building', 'San Francisco'),
      place('b', 'Ferry  building', 'san francisco'),
      place('c', 'Ferry Building', 'Oakland'),
    ]);
    expect(result.map((item) => item.id)).toEqual(['a', 'c']);
  });
});

describe('highlightSegments', () => {
  it('marks every query word case-insensitively', () => {
    expect(highlightSegments('Ferry Building', 'fer bui')).toEqual([
      { text: 'Fer', match: true },
      { text: 'ry ', match: false },
      { text: 'Bui', match: true },
      { text: 'lding', match: false },
    ]);
  });

  it('returns the whole text when the query is empty', () => {
    expect(highlightSegments('Mission', '  ')).toEqual([{ text: 'Mission', match: false }]);
  });
});
