import { TIMER_PRESETS } from './TimerSelect.ts';
import './TimerSelect.scss';

interface TimerSelectProps {
  value: number;
  onChange: (seconds: number) => void;
}

export default function TimerSelect({ value, onChange }: TimerSelectProps) {
  return (
    <select
      className="input timer-select"
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      aria-label="Temporizador para fechar automaticamente"
    >
      {TIMER_PRESETS.map((preset) => (
        <option key={preset.seconds} value={preset.seconds}>
          {preset.label}
        </option>
      ))}
    </select>
  );
}
