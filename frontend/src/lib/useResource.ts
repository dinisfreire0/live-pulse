import { useCallback, useEffect, useRef, useState } from 'react';
import { type ApiError, toApiError } from '../api/client.ts';

export function useResource<T>(load: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(true);
  const latestRequest = useRef(0);

  const fetchData = useCallback(async () => {
    const requestId = ++latestRequest.current;
    try {
      const result = await load();
      if (requestId === latestRequest.current) {
        setData(result);
        setError(null);
      }
    } catch (err) {
      if (requestId === latestRequest.current) setError(toApiError(err));
    } finally {
      if (requestId === latestRequest.current) setLoading(false);
    }
  }, [load]);

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    void fetchData();
  }, [fetchData]);

  const reload = useCallback(() => {
    setLoading(true);
    return fetchData();
  }, [fetchData]);

  return { data, setData, error, loading, reload };
}
