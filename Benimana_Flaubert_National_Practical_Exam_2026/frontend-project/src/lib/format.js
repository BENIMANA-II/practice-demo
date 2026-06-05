// Display helpers. Figures shown IN FULL with thousands separators (never compacted).
export function formatMoney(value) {
  const n = Number(value || 0);
  return "RWF " + n.toLocaleString("en-US", { minimumFractionDigits: 0 });
}

export function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-US");
}

// MySQL DATE comes back as an ISO string; show just the date part.
export function formatDate(value) {
  if (!value) return "—";
  const s = String(value);
  return s.slice(0, 10);
}
