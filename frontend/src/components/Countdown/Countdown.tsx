import { formatDuration, useCountdown } from './Countdown.ts';
import './Countdown.scss';

interface CountdownProps {
  closesAt: string;
}

export default function Countdown({ closesAt }: CountdownProps) {
  const secondsLeft = useCountdown(closesAt) ?? 0;
  const urgent = secondsLeft <= 10;

  return (
    <span className={`countdown${urgent ? ' countdown--urgent' : ''}`} role="timer">
      ⏱{' '}
      {secondsLeft > 0 ? (
        <>
          Fecha em <strong>{formatDuration(secondsLeft)}</strong>
        </>
      ) : (
        'A fechar…'
      )}
    </span>
  );
}
