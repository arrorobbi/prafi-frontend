"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { errorMessage } from "./api";

/** Runs an async loader on mount and whenever `deps` change; `reload()` runs it again. */
export function useAsync<T>(load: () => Promise<T>, deps: React.DependencyList) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const loadRef = useRef(load);
  loadRef.current = load;
  const run = useRef(0);

  const reload = useCallback(async () => {
    const id = ++run.current;
    setLoading(true);
    setError(null);
    try {
      const result = await loadRef.current();
      if (id === run.current) setData(result);
    } catch (err) {
      if (id === run.current) setError(errorMessage(err));
    } finally {
      if (id === run.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, error, loading, reload, setData };
}
