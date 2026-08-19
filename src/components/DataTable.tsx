import { memo, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, Search, SlidersHorizontal, Download, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button, Checkbox, Checkbox2, Dropdown, EmptyState, Pagination, Skeleton } from '@/components/ui';

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'right' | 'center';
  render: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (v: string) => void;
  pageSize?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  rowActions?: (row: T) => { label: string; icon?: ReactNode; onClick?: () => void; danger?: boolean; divider?: boolean }[];
  onRowClick?: (row: T) => void;
  toolbar?: ReactNode;
  totalCount?: number;
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  loading,
  searchable,
  searchPlaceholder = 'Search...',
  searchValue,
  onSearchChange,
  pageSize = 8,
  emptyTitle = 'No records found',
  emptyDescription = 'Try adjusting your filters or search query.',
  emptyAction,
  rowActions,
  onRowClick,
  toolbar,
  totalCount,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Only re-sort when the inputs that actually affect ordering change —
  // previously this ran on every render (including ones triggered by
  // unrelated state like `selected`), re-sorting identical data each time.
  const sorted = useMemo(() => {
    const next = [...data];
    if (sortKey) {
      const col = columns.find((c) => c.key === sortKey);
      if (col?.sortValue) {
        next.sort((a, b) => {
          const av = col.sortValue!(a);
          const bv = col.sortValue!(b);
          if (av < bv) return sortDir === 'asc' ? -1 : 1;
          if (av > bv) return sortDir === 'asc' ? 1 : -1;
          return 0;
        });
      }
    }
    return next;
  }, [data, columns, sortKey, sortDir]);

  const total = totalCount ?? sorted.length;
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));

  // Clamp the current page back into range whenever the filtered/searched dataset shrinks
  // (e.g. typing a narrower search term while on page 2 of a longer list). Without this, the
  // table renders "No records found" for a page that's simply out of range — even though
  // matching rows exist — and Pagination is hidden (only rendered when `paged.length > 0`),
  // leaving no way back to page 1.
  useEffect(() => {
    if (page > totalPages) {
      setPage(1);
    }
  }, [totalPages, page]);

  const paged = useMemo(() => sorted.slice((page - 1) * pageSize, page * pageSize), [sorted, page, pageSize]);
  const allSelected = paged.length > 0 && paged.every((r) => selected.has(r.id));
  const someSelected = paged.some((r) => selected.has(r.id));

  // Stable callback identities so memoized rows don't re-render just because
  // the parent re-rendered.
  const toggleSort = useCallback((key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }, [sortKey]);

  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      const next = new Set(prev);
      const allCurrentlySelected = paged.length > 0 && paged.every((r) => next.has(r.id));
      if (allCurrentlySelected) paged.forEach((r) => next.delete(r.id));
      else paged.forEach((r) => next.add(r.id));
      return next;
    });
  }, [paged]);

  const toggleRow = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return (
    <div className="card-base overflow-hidden">
      {/* Toolbar */}
      {(searchable || toolbar) && (
        <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-200 flex-wrap">
          {searchable && (
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
              <input
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
                placeholder={searchPlaceholder}
                className="input-base pl-9 h-9"
              />
            </div>
          )}
          {toolbar}
          <Button variant="outline" size="sm" leftIcon={<SlidersHorizontal className="h-4 w-4" />}>Filter</Button>
          <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />}>Export</Button>
        </div>
      )}

      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-brand-50 border-b border-brand-200 animate-fade-in">
          <span className="text-body font-medium text-brand-700">{selected.size} selected</span>
          <div className="flex-1" />
          <Button variant="ghost" size="sm">Bulk Edit</Button>
          <Button variant="ghost" size="sm">Export Selected</Button>
          <Button variant="ghost" size="sm" className="text-error-600 hover:bg-error-50">Delete</Button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-surface-50 sticky top-0">
            <tr>
              <th className="w-10 px-4 py-2.5">
                <Checkbox2 checked={allSelected ? true : someSelected ? 'indeterminate' : false} onChange={toggleAll} />
              </th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  className={cn('px-4 py-2.5 text-caption font-semibold text-surface-600 uppercase tracking-wider', col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left')}
                >
                  {col.sortable ? (
                    <button onClick={() => toggleSort(col.key)} className="inline-flex items-center gap-1 hover:text-surface-900 transition-colors">
                      {col.header}
                      {sortKey === col.key ? (
                        sortDir === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronsUpDown className="h-3.5 w-3.5 text-surface-300" />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              ))}
              {rowActions && <th className="w-10 px-4 py-2.5" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-4" /></td>
                  {columns.map((c) => <td key={c.key} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>)}
                  <td className="px-4 py-3" />
                </tr>
              ))
            ) : paged.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 2}>
                  <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
                </td>
              </tr>
            ) : (
              paged.map((row) => (
                <TableRow
                  key={row.id}
                  row={row}
                  columns={columns}
                  isSelected={selected.has(row.id)}
                  onToggle={toggleRow}
                  onRowClick={onRowClick}
                  rowActions={rowActions}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && paged.length > 0 && (
        <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPageChange={setPage} />
      )}
    </div>
  );
}

interface TableRowProps<T> {
  row: T;
  columns: Column<T>[];
  isSelected: boolean;
  onToggle: (id: string) => void;
  onRowClick?: (row: T) => void;
  rowActions?: (row: T) => { label: string; icon?: ReactNode; onClick?: () => void; danger?: boolean; divider?: boolean }[];
}

// Memoized so toggling one row's checkbox (or any other localized state
// change) only re-renders that row instead of every row in the table —
// `isSelected` is now a plain boolean prop instead of an inline `.has()`
// lookup, and `onToggle` is a stable callback, so unaffected rows see
// identical props and bail out of re-rendering entirely.
function TableRowInner<T extends { id: string }>({ row, columns, isSelected, onToggle, onRowClick, rowActions }: TableRowProps<T>) {
  return (
    <tr
      onClick={() => onRowClick?.(row)}
      className={cn('transition-colors', isSelected ? 'bg-brand-50/50' : 'hover:bg-surface-50', onRowClick && 'cursor-pointer')}
    >
      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <Checkbox checked={isSelected} onChange={() => onToggle(row.id)} />
      </td>
      {columns.map((col) => (
        <td key={col.key} className={cn('px-4 py-3 text-body text-surface-700', col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left')}>
          {col.render(row)}
        </td>
      ))}
      {rowActions && (
        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
          <Dropdown
            align="right"
            ariaLabel="Row actions"
            trigger={<span className="flex h-7 w-7 items-center justify-center rounded-md text-surface-400 hover:bg-surface-100 hover:text-surface-700 transition-colors"><MoreHorizontal className="h-4 w-4" /></span>}
            items={rowActions(row).map((a) => ({ label: a.label, icon: a.icon, onClick: a.onClick, danger: a.danger }))}
          />
        </td>
      )}
    </tr>
  );
}

const TableRow = memo(TableRowInner) as typeof TableRowInner;
