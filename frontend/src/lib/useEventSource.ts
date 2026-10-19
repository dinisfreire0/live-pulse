import { useEffect, useRef, useState } from 'react';

export type LiveStatus = 'idle' | 'connecting' | 'live';

export function useEventSource<T>(url: string | null, onMessage: (data: T) => void): LiveStatus {
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
