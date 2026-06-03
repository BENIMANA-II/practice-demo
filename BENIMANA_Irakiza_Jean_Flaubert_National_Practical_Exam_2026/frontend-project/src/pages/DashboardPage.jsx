// Main page after login: stat cards, recent stock movements, and quick-action create modals.
import { useEffect, useState, useCallback } from 'react';
import { Package, Warehouse as WarehouseIcon, ArrowsLeftRight, CalendarCheck, CurrencyDollar, ArrowDown, ArrowUp, Plus, CaretRight } from '@phosphor-icons/react';
import { getDashboard } from '@/api/reportsAPI';
import { extractError } from '@/api/axiosClient';
import { formatNumber, formatCompactCurrency, formatDate } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ProductForm from '@/components/ProductForm';
import WarehouseForm from '@/components/WarehouseForm';
import TransactionForm from '@/components/TransactionForm';
import { PageWrapper, StateBlock } from '@/components/common';

const QUICK_ACTIONS = [
  { key: 'product', label: 'New Product', description: 'Add an item to the catalogue', icon: Package },
  { key: 'warehouse', label: 'New Warehouse', description: 'Register a depot or branch', icon: WarehouseIcon },
  { key: 'transaction', label: 'New Transaction', description: 'Record a stock movement', icon: ArrowsLeftRight },
];

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openAction, setOpenAction] = useState(null); // 'product' | 'warehouse' | 'transaction'

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getDashboard();
      setData(result);
    } catch (err) {
      console.error(err);
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = data?.stats;
  const cards = stats
    ? [
        { label: 'Products', value: formatNumber(stats.totalProducts), icon: Package },
        { label: 'Warehouses', value: formatNumber(stats.totalWarehouses), icon: WarehouseIcon },
        { label: 'Transactions', value: formatNumber(stats.totalTransactions), icon: ArrowsLeftRight },
        { label: "Today's Transactions", value: formatNumber(stats.todayTransactions), icon: CalendarCheck },
        { label: 'Total Stock Value', value: formatCompactCurrency(stats.totalStockValue), icon: CurrencyDollar },
      ]
    : [];

  return (
    <PageWrapper>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-[var(--color-muted)]">Overview of your stock records.</p>
      </div>

      <StateBlock loading={loading} error={error} onRetry={load}>
        {data && (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {cards.map(({ label, value, icon: Icon }) => (
                <Card key={label}>
                  <CardContent className="flex flex-col items-center gap-2 p-5 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--color-bg)] text-[var(--color-accent)]">
                      <Icon size={22} />
                    </div>
                    <span className="text-sm text-[var(--color-muted)]">{label}</span>
                    <span className="text-2xl font-bold tabular-nums tracking-[-0.03em] text-[var(--color-accent)]">
                      {value}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Recent Stock Movements</CardTitle>
                </CardHeader>
                <CardContent>
                  {data.recentActivity.length === 0 ? (
                    <p className="py-6 text-center text-sm text-[var(--color-muted)]">No transactions recorded yet.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Warehouse</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead className="text-right">Value</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.recentActivity.map((row) => (
                          <TableRow key={row._id}>
                            <TableCell>{row.productName}</TableCell>
                            <TableCell>{row.warehouseName}</TableCell>
                            <TableCell className="whitespace-nowrap">
                              <span
                                className="inline-flex items-center gap-1 font-medium"
                                style={{ color: row.transactionType === 'STOCK_IN' ? 'var(--color-success)' : 'var(--color-danger)' }}
                              >
                                {row.transactionType === 'STOCK_IN' ? (
                                  <ArrowDown size={14} weight="bold" />
                                ) : (
                                  <ArrowUp size={14} weight="bold" />
                                )}
                                {row.transactionType === 'STOCK_IN' ? 'Stock In' : 'Stock Out'}
                              </span>
                            </TableCell>
                            <TableCell className="text-right tabular-nums">{formatNumber(row.quantityMoved)}</TableCell>
                            <TableCell className="text-right tabular-nums font-medium">
                              <span style={{ color: row.transactionType === 'STOCK_IN' ? 'var(--color-success)' : 'var(--color-danger)' }}>
                                {row.transactionType === 'STOCK_IN' ? '+' : '−'} {formatCompactCurrency(row.value)}
                              </span>
                            </TableCell>
                            <TableCell>{formatDate(row.transactionDate)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              <Card className="flex flex-col lg:col-span-1">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-3">
                  {QUICK_ACTIONS.map(({ key, label, description, icon: Icon }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setOpenAction(key)}
                      className="flex flex-1 items-center gap-3 rounded-lg border border-[var(--color-border)] p-3 text-left transition-colors hover:bg-[var(--color-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-accent)] text-[var(--color-accent-foreground)]">
                        <Icon size={20} />
                      </span>
                      <span className="flex min-w-0 flex-col">
                        <span className="flex items-center gap-1 font-medium text-[var(--color-text)]">
                          <Plus size={14} />
                          {label}
                        </span>
                        <span className="text-xs text-[var(--color-muted)]">{description}</span>
                      </span>
                      <CaretRight size={16} className="ml-auto shrink-0 text-[var(--color-muted)]" />
                    </button>
                  ))}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </StateBlock>

      {/* Quick Action modals — create without leaving the dashboard; refresh stats on success. */}
      <Dialog open={openAction === 'product'} onOpenChange={(o) => !o && setOpenAction(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>New Product</DialogTitle>
          </DialogHeader>
          <ProductForm onCreated={() => { setOpenAction(null); load(); }} />
        </DialogContent>
      </Dialog>

      <Dialog open={openAction === 'warehouse'} onOpenChange={(o) => !o && setOpenAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Warehouse</DialogTitle>
          </DialogHeader>
          <WarehouseForm onCreated={() => { setOpenAction(null); load(); }} />
        </DialogContent>
      </Dialog>

      <Dialog open={openAction === 'transaction'} onOpenChange={(o) => !o && setOpenAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Transaction</DialogTitle>
          </DialogHeader>
          <TransactionForm selfLoad onCreated={() => { setOpenAction(null); load(); }} />
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
