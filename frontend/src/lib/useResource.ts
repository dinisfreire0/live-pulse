import { useCallback, useEffect, useRef, useState } from 'react';
import { type ApiError, toApiError } from '../api/client.ts';

/**
 * Loads data on mount (and whenever `load` changes) and exposes a `reload`
 * for manual refresh buttons. `load` must be memoised by the caller.
 */
export function useResource<T>(load: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(true);
  const latestRequest = useRef(0);

  const fetchData = useCallback(async () => {
    // Only the most recent request may update state (e.g. double clicks on "refresh").
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
    // State is only set after the request resolves, never synchronously here.
    // oxlint-disable-next-line react/set-state-in-effect
    void fetchData();
  }, [fetchData]);

  const reload = useCallback(() => {
    setLoading(true);
    return fetchData();
  }, [fetchData]);

  return { data, setData, error, loading, reload };
}
