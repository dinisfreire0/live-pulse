import { useEffect, useRef, useState } from 'react';

export type LiveStatus = 'idle' | 'connecting' | 'live';

/**
 * Subscribes to a Server-Sent Events stream while `url` is not null.
 * The browser's EventSource reconnects automatically after errors.
 */
export function useEventSource<T>(url: string | null, onMessage: (data: T) => void): LiveStatus {
  // Remember which URL the status belongs to, so a new URL starts as "connecting".
  const [connection, setConnection] = useState<{ url: string; open: boolean } | null>(null);
  const handlerRef = useRef(onMessage);

  useEffect(() => {
    handlerRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!url) return;
    const source = new EventSource(url);
    source.onopen = () => setConnection({ url, open: true });
    source.onerror = () => setConnection({ url, open: false });
    source.onmessage = (event: MessageEvent<string>) => {
      handlerRef.current(JSON.parse(event.data) as T);
    };
    return () => source.close();
  }, [url]);

  if (!url) return 'idle';
  return connection?.url === url && connection.open ? 'live' : 'connecting';
}
