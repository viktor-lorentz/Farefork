import { useEffect, useState } from 'react';
import { useTheme } from '@/design/theme';
import type { SkyPhase } from '@/design/tokens';
import { useDeviceLocation } from '@/stores/location';
import { dayPartForHour, skyPhaseAt, type DayPart } from './skyPhase';

const MINUTE = 60_000;

function useMinuteClock(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, MINUTE);
    return () => {
      clearInterval(timer);
    };
  }, []);
  return now;
}

export function useSkyPhase(): { phase: SkyPhase; dayPart: DayPart } {
  const { scheme } = useTheme();
  const location = useDeviceLocation((state) => state.lastKnown);
  const now = useMinuteClock();
  return {
    phase: scheme === 'dark' ? 'night' : skyPhaseAt(now, location),
    dayPart: dayPartForHour(now.getHours()),
  };
}
