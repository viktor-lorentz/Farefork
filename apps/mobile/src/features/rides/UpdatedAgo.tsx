import { useEffect, useState } from 'react';
import { Text } from '@/design/components';

const TICK_MS = 5_000;

export function updatedLabel(since: Date, now: Date): string {
  const seconds = Math.max(0, Math.round((now.getTime() - since.getTime()) / 1000));
  if (seconds < 10) {
    return 'Updated just now';
  }
  if (seconds < 60) {
    return `Updated ${seconds}s ago`;
  }
  return `Updated ${Math.floor(seconds / 60)} min ago`;
}

export function UpdatedAgo({ since }: { since: Date }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => {
      setNow(new Date());
    }, TICK_MS);
    return () => {
      clearInterval(id);
    };
  }, [since]);
  return (
    <Text variant="caption" tone="tertiary" tabular numberOfLines={1}>
      {updatedLabel(since, now)}
    </Text>
  );
}
