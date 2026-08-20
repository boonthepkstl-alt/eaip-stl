import { useState, useEffect } from 'react';
import api from '@/services/api';
import { AxiosError } from 'axios';

interface UseFetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useFetch<T>(url: string, dependencies: unknown[] = []) {
  const [state, setState] = useState<UseFetchState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await api.get<T>(url);
        if (isMounted) {
          setState({ data: response.data, loading: false, error: null });
        }
      } catch (err) {
        if (isMounted) {
          const error = err as AxiosError;
          setState({
            data: null,
            loading: false,
            error: error.message || 'An error occurred',
          });
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, dependencies);

  return state;
}
