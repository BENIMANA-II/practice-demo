// Reusable building blocks shared by the pages. Declared at module top level.
import { Spinner, Warning, Tray } from "@phosphor-icons/react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Page shell: a centered, padded container that is a @container for child queries.
export function PageWrapper({ title, description, children }) {
  return (
    <div className="@container mx-auto w-full max-w-7xl px-4 py-6">
      {title && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

// Label + Input + inline error. `error` is the message string ("" when valid).
export function FormField({ label, name, error, children, ...inputProps }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      {children ? (
        children
      ) : (
        <Input id={name} name={name} className={cn(error && "border-destructive")} {...inputProps} />
      )}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}

// Loading / error / empty state in one place.
export function StateBlock({ loading, error, empty, emptyText = "No records yet." }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
        <Spinner size={20} className="animate-spin" />
        <span>Loading…</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-destructive">
        <Warning size={20} />
        <span>{error}</span>
      </div>
    );
  }
  if (empty) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
        <Tray size={28} />
        <span>{emptyText}</span>
      </div>
    );
  }
  return null;
}

// Simple pagination helper: slices a list and renders prev/next controls.
export function paginate(list, page, perPage) {
  const total = list.length;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(page, pages);
  const start = (safePage - 1) * perPage;
  return { slice: list.slice(start, start + perPage), pages, safePage, total };
}

export function Pagination({ page, pages, onPrev, onNext }) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-end gap-3 pt-3 text-sm">
      <button
        onClick={onPrev}
        disabled={page <= 1}
        className="rounded-md border px-3 py-1 disabled:opacity-40 hover:bg-muted"
      >
        Prev
      </button>
      <span className="text-muted-foreground tabular-nums">
        Page {page} of {pages}
      </span>
      <button
        onClick={onNext}
        disabled={page >= pages}
        className="rounded-md border px-3 py-1 disabled:opacity-40 hover:bg-muted"
      >
        Next
      </button>
    </div>
  );
}
