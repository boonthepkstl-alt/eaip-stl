import { useEffect, useState, useCallback } from 'react';
import { ticketService } from '@/services/ticket-service';
import type { Ticket, TicketListQuery } from '@/types/ticket';

interface UseTicketsResult {
  tickets: Ticket[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useTickets(query: TicketListQuery): UseTicketsResult {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    ticketService
      .listTickets(query)
      .then((result) => {
        if (cancelled) return;
        setTickets(result.data);
        setTotal(result.total);
      })
      .catch(() => {
        if (cancelled) return;
        setError('Unable to load IT requisition tickets. Please try again.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run on any query field change or explicit refetch
  }, [query.search, query.status, query.priority, query.category, query.department, query.requesterName, reloadToken]);

  return { tickets, total, loading, error, refetch };
}
