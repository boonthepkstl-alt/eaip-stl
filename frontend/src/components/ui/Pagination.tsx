import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from './Button';

export interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (p: number) => void;
}

export function Pagination({ page, totalPages, total, pageSize, onPageChange }: PaginationProps) {
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3 border-t border-surface-200">
      <p className="text-caption text-surface-500">
        Showing <span className="font-medium text-surface-700">{start}-{end}</span> of <span className="font-medium text-surface-700">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => onPageChange(page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          const p = i + 1;
          return (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={cn('h-8 min-w-8 px-2 rounded-md text-caption font-medium transition-colors', page === p ? 'bg-brand-600 text-white' : 'text-surface-600 hover:bg-surface-100')}
            >
              {p}
            </button>
          );
        })}
        <Button variant="outline" size="icon" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}><ChevronRight className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}
