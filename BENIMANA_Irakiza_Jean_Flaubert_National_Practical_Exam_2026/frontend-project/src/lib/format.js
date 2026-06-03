// Human-friendly formatting helpers (single source of truth for dates/numbers/currency).
export function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(value) {
  const d = value ? new Date(value) : new Date();
  return d.toLocaleString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatNumber(value) {
  const n = Number(value || 0);
  return n.toLocaleString('en-US');
}

export function formatCurrency(value) {
  const n = Number(value || 0);
  return `RWF ${n.toLocaleString('en-US')}`;
}

// Compact currency for stat cards: 1K, 6.75M, 3B, etc. (keeps up to 2 decimals so 6,750,000 → 6.75M).
export function formatCompactCurrency(value) {
  const n = Number(value || 0);
  const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(n);
  return `RWF ${compact}`;
}

// Current-user label: "System Admin" for the seeded admin, otherwise the full name.
// Reused by the Navbar and the Reports print footer so the label is defined once.
export function getUserLabel(user) {
  if (!user) return '';
  if (user.isAdmin) return 'System Admin';
  return user.fullName;
}
