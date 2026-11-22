import type { LatLng } from '@repo/shared';
import { getPosition } from 'suncalc';
import type { SkyPhase } from '@/design/tokens';

export function phaseForSunAltitude(degrees: number): SkyPhase {
  if (degrees >= 10) {
    return 'day';
  }
  if (degrees >= -2) {
    return 'golden';
  }
  if (degrees >= -12) {
    return 'dusk';
  }
  return 'night';
}

export function phaseForHour(hour: number): SkyPhase {
  if (hour >= 8 && hour < 16.5) {
    return 'day';
  }
  if ((hour >= 6.5 && hour < 8) || (hour >= 16.5 && hour < 18.25)) {
    return 'golden';
  }
  if ((hour >= 5.5 && hour < 6.5) || (hour >= 18.25 && hour < 19.75)) {
    return 'dusk';
  }
  return 'night';
}

export function skyPhaseAt(date: Date, location: LatLng | null): SkyPhase {
  if (location) {
    const { altitude } = getPosition(date, location.latitude, location.longitude);
    return phaseForSunAltitude(altitude);
  }
  return phaseForHour(date.getHours() + date.getMinutes() / 60);
}

export type DayPart = 'morning' | 'afternoon' | 'evening' | 'night';

export function dayPartForHour(hour: number): DayPart {
  if (hour >= 5 && hour < 12) {
    return 'morning';
  }
  if (hour >= 12 && hour < 17) {
    return 'afternoon';
  }
  if (hour >= 17 && hour < 22) {
    return 'evening';
  }
  return 'night';
}
