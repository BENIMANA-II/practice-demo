// Transactions page: record stock movements (create form on the left) and manage them
// (searchable, sortable, paginated list with edit & delete) on the right.
import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  CircleNotch,
  ArrowsLeftRight,
  PencilSimple,
  Trash,
  MagnifyingGlass,
  CaretUp,
  CaretDown,
  ArrowDown,
  ArrowUp,
} from '@phosphor-icons/react';
import { toast } from 'sonner';

import { getAllTransactions, updateTransaction, deleteTransaction } from '@/api/transactionAPI';
import { getAllProducts } from '@/api/productAPI';
import { getAllWarehouses } from '@/api/warehouseAPI';
import { extractError } from '@/api/axiosClient';
import { TRANSACTION_TYPES } from '@/lib/constants';
import { todayISO } from '@/lib/validators';
import { formatDate, formatNumber, formatCompactCurrency } from '@/lib/format';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import TransactionForm, { EMPTY_TRANSACTION, validateTransactionValues } from '@/components/TransactionForm';
import {
  PageWrapper,
  FormField,
  StateBlock,
  Pagination,
  usePagination,
  useMeasuredHeight,
  useMediaQuery,
} from '@/components/common';

export default function TransactionPage() {
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_TRANSACTION);
  const [editErrors, setEditErrors] = useState({});
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL' | 'STOCK_IN' | 'STOCK_OUT'
  const [sort, setSort] = useState({ key: 'transactionDate', dir: 'desc' });

  const [formRef, formHeight] = useMeasuredHeight();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const allCardStyle = isDesktop && formHeight ? { height: formHeight } : undefined;

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [tx, prod, wh] = await Promise.all([getAllTransactions(), getAllProducts(), getAllWarehouses()]);
      setTransactions(tx);
      setProducts(prod);
      setWarehouses(wh);
    } catch (err) {
      console.error(err);
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Lookup of full product docs (with unitPrice) for the Value column.
  const productById = useMemo(() => {
    const map = {};
    for (const p of products) map[p._id] = p;
    return map;
  }, [products]);

  function openEdit(t) {
    setEditing(t);
    setEditErrors({});
    setEditForm({
      product: t.product?._id || '',
      warehouse: t.warehouse?._id || '',
      transactionType: t.transactionType,
      quantityMoved: String(t.quantityMoved),
      transactionDate: new Date(t.transactionDate).toISOString().split('T')[0],
    });
  }

  async function handleUpdate(e) {
    e.preventDefault();
    const next = validateTransactionValues(editForm, products, transactions, editing._id);
    setEditErrors(next);
    if (!Object.values(next).every((v) => !v)) {
      toast.error('Please fix the highlighted fields');
      return;
    }
    setEditSubmitting(true);
    try {
      await updateTransaction(editing._id, { ...editForm, quantityMoved: Number(editForm.quantityMoved) });
      toast.success('Transaction updated successfully');
      setEditing(null);
      await loadAll();
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteTransaction(deleteTarget._id);
      toast.success('Transaction deleted');
      setDeleteTarget(null);
      await loadAll();
    } catch (err) {
      toast.error(extractError(err));
    }
  }

  function toggleSort(key) {
    setSort((prev) => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' }));
  }

  const visibleRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    let rows = transactions;
    // Filter by the selected type (Stock In / Stock Out), unless "All" is chosen.
    if (typeFilter !== 'ALL') {
      rows = rows.filter((t) => t.transactionType === typeFilter);
    }
    if (term) {
      rows = rows.filter((t) => {
        const productName = (t.product?.productName || '').toLowerCase();
        const warehouseName = (t.warehouse?.warehouseName || '').toLowerCase();
        return productName.includes(term) || warehouseName.includes(term) || t.transactionType.toLowerCase().includes(term);
      });
    }
    const sorted = [...rows].sort((a, b) => {
      let av;
      let bv;
      if (sort.key === 'product') {
        av = a.product?.productName || '';
        bv = b.product?.productName || '';
      } else if (sort.key === 'warehouse') {
        av = a.warehouse?.warehouseName || '';
        bv = b.warehouse?.warehouseName || '';
      } else if (sort.key === 'quantityMoved') {
        av = a.quantityMoved;
        bv = b.quantityMoved;
      } else if (sort.key === 'transactionType') {
        av = a.transactionType;
        bv = b.transactionType;
      } else {
        av = new Date(a.transactionDate).getTime();
        bv = new Date(b.transactionDate).getTime();
      }
      if (av < bv) return sort.dir === 'asc' ? -1 : 1;
      if (av > bv) return sort.dir === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [transactions, search, typeFilter, sort]);

  const { page, setPage, totalPages, pageItems, total, pageSize } = usePagination(visibleRows, 8);

  // Plain render helper (not a component) so it doesn't remount on every render.
  function renderSortHeader(label, sortKey, align) {
    return (
      <TableHead className={align === 'right' ? 'text-right' : ''}>
        <button
          type="button"
          onClick={() => toggleSort(sortKey)}
          className={`col-header inline-flex items-center gap-1 ${align === 'right' ? 'flex-row-reverse' : ''}`}
        >
          {label}
          {sort.key === sortKey && (sort.dir === 'asc' ? <CaretUp size={12} /> : <CaretDown size={12} />)}
        </button>
      </TableHead>
    );
  }

  return (
    <PageWrapper>
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-accent)] text-white">
          <ArrowsLeftRight size={22} />
        </span>
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="text-[var(--color-muted)]">Record stock-in and stock-out movements.</p>
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,320px)_1fr]">
        <Card ref={formRef} className="lg:sticky lg:top-20">
          <CardHeader>
            <CardTitle>New Transaction</CardTitle>
            <CardDescription>Select a product and warehouse, then record the movement.</CardDescription>
          </CardHeader>
          <CardContent>
            <TransactionForm products={products} warehouses={warehouses} transactions={transactions} onCreated={loadAll} />
          </CardContent>
        </Card>

        <Card style={allCardStyle} className="flex flex-col overflow-hidden">
          <CardHeader className="shrink-0 flex-row flex-wrap items-center justify-between gap-3 space-y-0">
            <CardTitle>All Transactions</CardTitle>
            <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="STOCK_IN">Stock In</SelectItem>
                  <SelectItem value="STOCK_OUT">Stock Out</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative w-full max-w-xs">
                <MagnifyingGlass size={16} className="absolute left-3 top-3 text-[var(--color-muted)]" />
                <Input className="pl-9" placeholder="Search transactions…" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 overflow-y-auto">
            <StateBlock
              loading={loading}
              error={error}
              onRetry={loadAll}
              empty={!loading && !error && visibleRows.length === 0}
              emptyMessage={search ? 'No transactions match your search.' : 'No transactions recorded yet.'}
            >
              <Table className="[&_td]:px-2 [&_td]:py-2 [&_th]:px-2">
                <TableHeader className="sticky-head">
                  <TableRow>
                    {renderSortHeader('Product', 'product')}
                    {renderSortHeader('Warehouse', 'warehouse')}
                    {renderSortHeader('Type', 'transactionType')}
                    {renderSortHeader('Quantity', 'quantityMoved', 'right')}
                    <TableHead className="text-right">Value</TableHead>
                    {renderSortHeader('Date', 'transactionDate')}
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageItems.map((t) => (
                    <TableRow key={t._id}>
                      <TableCell>{t.product?.productName || '—'}</TableCell>
                      <TableCell>{t.warehouse?.warehouseName || '—'}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span
                          className="inline-flex items-center gap-1 font-medium"
                          style={{ color: t.transactionType === 'STOCK_IN' ? 'var(--color-success)' : 'var(--color-danger)' }}
                        >
                          {t.transactionType === 'STOCK_IN' ? <ArrowDown size={14} weight="bold" /> : <ArrowUp size={14} weight="bold" />}
                          {t.transactionType === 'STOCK_IN' ? 'Stock In' : 'Stock Out'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumber(t.quantityMoved)}</TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        {(() => {
                          const prod = productById[t.product?._id];
                          if (!prod) return '—';
                          const isIn = t.transactionType === 'STOCK_IN';
                          const value = prod.unitPrice * t.quantityMoved;
                          return (
                            <span style={{ color: isIn ? 'var(--color-success)' : 'var(--color-danger)' }}>
                              {isIn ? '+' : '−'} {formatCompactCurrency(value)}
                            </span>
                          );
                        })()}
                      </TableCell>
                      <TableCell>{formatDate(t.transactionDate)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="icon" aria-label="Edit transaction" onClick={() => openEdit(t)}>
                            <PencilSimple size={16} />
                          </Button>
                          <Button variant="outline" size="icon" aria-label="Delete transaction" onClick={() => setDeleteTarget(t)}>
                            <Trash size={16} className="text-[var(--color-danger)]" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </StateBlock>
          </CardContent>
          {totalPages > 1 && (
            <div className="shrink-0 border-t border-[var(--color-border)] px-6 py-2">
              <Pagination page={page} setPage={setPage} totalPages={totalPages} total={total} pageSize={pageSize} />
            </div>
          )}
        </Card>
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-product">Product</Label>
              <Select value={editForm.product} onValueChange={(v) => setEditForm({ ...editForm, product: v })}>
                <SelectTrigger id="edit-product">
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p._id} value={p._id}>
                      {p.productName} ({p.productCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editErrors.product && <p role="alert" className="text-xs text-[var(--color-danger)]">{editErrors.product}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-warehouse">Warehouse</Label>
              <Select value={editForm.warehouse} onValueChange={(v) => setEditForm({ ...editForm, warehouse: v })}>
                <SelectTrigger id="edit-warehouse">
                  <SelectValue placeholder="Select warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((w) => (
                    <SelectItem key={w._id} value={w._id}>
                      {w.warehouseName} ({w.warehouseCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editErrors.warehouse && <p role="alert" className="text-xs text-[var(--color-danger)]">{editErrors.warehouse}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-type">Transaction Type</Label>
              <Select value={editForm.transactionType} onValueChange={(v) => setEditForm({ ...editForm, transactionType: v })}>
                <SelectTrigger id="edit-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {TRANSACTION_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editErrors.transactionType && <p role="alert" className="text-xs text-[var(--color-danger)]">{editErrors.transactionType}</p>}
            </div>
            <FormField id="edit-quantity" label="Quantity Moved" type="number" min="1" value={editForm.quantityMoved} error={editErrors.quantityMoved} onChange={(e) => setEditForm({ ...editForm, quantityMoved: e.target.value })} />
            <FormField id="edit-date" label="Transaction Date" type="date" max={todayISO()} value={editForm.transactionDate} error={editErrors.transactionDate} onChange={(e) => setEditForm({ ...editForm, transactionDate: e.target.value })} />
            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={editSubmitting}>
                {editSubmitting && <CircleNotch size={16} className="animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes this single transaction record. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageWrapper>
  );
}
