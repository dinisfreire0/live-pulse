import { useEffect, useState } from 'react';

export function useCountdown(closesAt: string | null): number | null {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!closesAt) return;
    const tick = () => setNow(Date.now());
    const firstTick = setTimeout(tick, 0);
    const timer = setInterval(tick, 1000);
    return () => {
      clearTimeout(firstTick);
      clearInterval(timer);
    };
  }, [closesAt]);

  if (!closesAt) return null;
  return Math.max(0, Math.ceil((Date.parse(closesAt) - now) / 1000));
}

export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${seconds}`
    : `${minutes}:${seconds}`;
}
