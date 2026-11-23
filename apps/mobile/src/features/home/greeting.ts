import type { DayPart } from '@/features/scene/skyPhase';

const greetings: Record<DayPart, string> = {
  morning: 'Good morning',
  afternoon: 'Good afternoon',
  evening: 'Good evening',
  night: 'Out late?',
};

export function greetingFor(dayPart: DayPart) {
  return greetings[dayPart];
}
