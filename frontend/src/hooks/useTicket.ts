import { useEffect, useState, useCallback } from 'react';
import { ticketService } from '@/services/ticket-service';
import type { Ticket } from '@/types/ticket';

interface UseTicketResult {
  ticket: Ticket | null;
  loading: boolean;
  error: string | null;
  notFound: boolean;
  refetch: () => void;
}

export function useTicket(ticketCode: string | undefined): UseTicketResult {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  useEffect(() => {
    if (!ticketCode) {
      setLoading(false);
      setNotFound(true);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setNotFound(false);

    ticketService
      .getTicket(ticketCode)
      .then((result) => {
        if (cancelled) return;
        if (!result) {
          setNotFound(true);
        } else {
          setTicket(result);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setError('Unable to load this ticket. Please try again.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [ticketCode, reloadToken]);

  return { ticket, loading, error, notFound, refetch };
}
