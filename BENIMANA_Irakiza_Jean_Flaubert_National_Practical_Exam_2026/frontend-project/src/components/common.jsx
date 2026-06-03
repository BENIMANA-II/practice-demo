// Small shared building blocks reused across pages: page wrapper, form field, loading/error/empty
// states, the recovery-code panel, pagination, and two helper hooks.
import { useState, useEffect, useRef, useMemo } from 'react';
import { CircleNotch, WarningCircle, Tray, Copy, DownloadSimple, ShieldCheck, CaretLeft, CaretRight } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { SYSTEM_NAME } from '@/lib/constants';
import { cn } from '@/lib/utils';

// Shared max-width/padding wrapper for every authenticated page.
export function PageWrapper({ children, className }) {
  return <main className={cn('mx-auto w-full max-w-6xl px-4 py-8', className)}>{children}</main>;
}

// Tracks an element's rendered outer height so a sibling card can match it. Returns [ref, height].
export function useMeasuredHeight() {
  const ref = useRef(null);
  const [height, setHeight] = useState(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const observer = new ResizeObserver(() => setHeight(node.offsetHeight));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return [ref, height];
}

// Reports whether a media query currently matches (used to apply equal-height only on desktop).
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = () => setMatches(mql.matches);
    handler();
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);
  return matches;
}

// Client-side pagination over an already-loaded array. Returns the current page slice + controls.
export function usePagination(items, pageSize = 8) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);
  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);
  return { page, setPage, totalPages, pageItems, total: items.length, pageSize };
}

export function Pagination({ page, setPage, totalPages, total, pageSize }) {
  if (total <= pageSize) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <div className="flex items-center justify-between gap-4 pt-4 text-sm text-[var(--color-muted)]">
      <span>
        {from}–{to} of {total}
      </span>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)} aria-label="Previous page">
          <CaretLeft size={14} />
        </Button>
        <span>
          Page {page} / {totalPages}
        </span>
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)} aria-label="Next page">
          <CaretRight size={14} />
        </Button>
      </div>
    </div>
  );
}

// Label + Input + inline error, kept as a stable module-level component to avoid focus loss.
export function FormField({ id, label, error, hint, children, ...inputProps }) {
  const describedBy = error ? `${id}-error` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children || <Input id={id} aria-invalid={!!error} aria-describedby={describedBy} {...inputProps} />}
      {hint && !error && <p className="text-xs text-[var(--color-muted)]">{hint}</p>}
      {error && (
        <p id={describedBy} role="alert" className="text-xs text-[var(--color-danger)]">
          {error}
        </p>
      )}
    </div>
  );
}

// Unified loading / error / empty states so no view is ever blank.
export function StateBlock({ loading, error, empty, onRetry, emptyMessage = 'No records yet.', children }) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-[var(--color-muted)]">
        <CircleNotch size={32} className="animate-spin text-[var(--color-accent)]" />
        <p className="text-sm">Loading…</p>
      </div>
    );
  }
  if (error) {
    return (
      <Alert variant="destructive" className="my-4">
        <WarningCircle size={18} />
        <AlertDescription className="flex w-full items-center justify-between gap-4">
          <span>{error}</span>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              Retry
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }
  if (empty) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-[var(--color-muted)]">
        <Tray size={32} />
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }
  return children;
}

// One-time recovery-code panel shown after register/reset: copy, download, and a required confirm.
export function RecoveryCodeCard({ code, username, onContinue }) {
  const [confirmed, setConfirmed] = useState(false);

  function copyCode() {
    navigator.clipboard.writeText(code);
    toast.success('Recovery code copied');
  }

  function downloadCode() {
    const content = `${SYSTEM_NAME} recovery code\nUsername: ${username}\nRecovery code: ${code}\n\nKeep this safe — it is needed to recover your account.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${SYSTEM_NAME.toLowerCase()}-recovery-code.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Recovery code downloaded');
  }

  return (
    <Card className="w-full">
      <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
        <ShieldCheck size={36} className="text-[var(--color-accent)]" />
        <h2 className="text-lg font-semibold">Save your recovery code</h2>
        <p className="text-sm text-[var(--color-muted)]">
          This code recovers your account if you forget your password. It is shown only once — save it now.
        </p>
        <div className="select-all rounded-xl bg-[var(--color-bg)] px-8 py-4 font-mono text-4xl font-bold tracking-[0.3em] text-[var(--color-accent)]">
          {code}
        </div>
        <div className="flex w-full gap-2">
          <Button variant="outline" className="flex-1" onClick={copyCode}>
            <Copy size={16} />
            Copy code
          </Button>
          <Button variant="outline" className="flex-1" onClick={downloadCode}>
            <DownloadSimple size={16} />
            Download
          </Button>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
          I have saved my recovery code
        </label>
        <Button className="w-full" disabled={!confirmed} onClick={onContinue}>
          I&apos;ve saved it — continue
        </Button>
      </CardContent>
    </Card>
  );
}
