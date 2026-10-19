import { useEffect, useState } from 'react';
import { paths } from '../../App/App.ts';

export function buildShareUrl(pollId: number): string {
  const base = import.meta.env.VITE_PUBLIC_BASE_URL || window.location.origin;
  return `${base.replace(/\/$/, '')}${paths.publicPoll(pollId)}`;
}

export function useCopyToClipboard(resetAfterMs = 2000) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), resetAfterMs);
    return () => clearTimeout(timer);
  }, [copied, resetAfterMs]);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      window.prompt('Copia o link:', text);
    }
  };

  return { copied, copy };
}
