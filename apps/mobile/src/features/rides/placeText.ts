import type { Place } from '@repo/shared';

function placeKey(place: Place): string {
  return `${place.name}|${place.address}`.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function dedupePlaces(places: readonly Place[]): Place[] {
  const seen = new Set<string>();
  return places.filter((place) => {
    const key = placeKey(place);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export type TextSegment = { text: string; match: boolean };

export function highlightSegments(text: string, query: string): TextSegment[] {
  const words = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 0);
  if (words.length === 0) {
    return [{ text, match: false }];
  }
  const lower = text.toLowerCase();
  const marks = new Array<boolean>(text.length).fill(false);
  for (const word of words) {
    let from = lower.indexOf(word);
    while (from !== -1) {
      for (let index = from; index < from + word.length; index += 1) {
        marks[index] = true;
      }
      from = lower.indexOf(word, from + word.length);
    }
  }
  const segments: TextSegment[] = [];
  for (let index = 0; index < text.length; index += 1) {
    const match = marks[index] ?? false;
    const last = segments[segments.length - 1];
    if (last?.match === match) {
      last.text += text.charAt(index);
    } else {
      segments.push({ text: text.charAt(index), match });
    }
  }
  return segments;
}
