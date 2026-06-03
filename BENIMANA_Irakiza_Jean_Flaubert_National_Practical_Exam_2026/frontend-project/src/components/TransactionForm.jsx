// The "create a transaction" form. Used on the Transactions page and in the dashboard's quick-action modal.
import { useState, useEffect, useMemo, useCallback } from 'react';
import { CircleNotch } from '@phosphor-icons/react';
import { toast } from 'sonner';

import { createTransaction, getAllTransactions } from '@/api/transactionAPI';
import { getAllProducts } from '@/api/productAPI';
import { getAllWarehouses } from '@/api/warehouseAPI';
import { extractError } from '@/api/axiosClient';
import { TRANSACTION_TYPES } from '@/lib/constants';
import { validateRequired, validateNonNegativeInteger, todayISO } from '@/lib/validators';
import { formatNumber } from '@/lib/format';
import { computeAvailable } from '@/lib/stock';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { FormField } from '@/components/common';

export const EMPTY_TRANSACTION = { product: '', warehouse: '', transactionType: '', quantityMoved: '', transactionDate: '' };

// Shared validation (stock-out cannot exceed available stock) used by create + the page's edit dialog.
export function validateTransactionValues(values, products, transactions, excludeId = null) {
  const next = {
    product: validateRequired(values.product, 'Product'),
    warehouse: validateRequired(values.warehouse, 'Warehouse'),
    transactionType: validateRequired(values.transactionType, 'Transaction type'),
    quantityMoved: validateNonNegativeInteger(values.quantityMoved, 'Quantity moved'),
    transactionDate: validateRequired(values.transactionDate, 'Transaction date'),
  };
  if (!next.quantityMoved && Number(values.quantityMoved) < 1) {
    next.quantityMoved = 'Quantity must be at least 1.';
  }
  if (!next.product && !next.quantityMoved && values.transactionType === 'STOCK_OUT') {
    const available = computeAvailable(values.product, products, transactions, excludeId);
    if (available !== null && Number(values.quantityMoved) > available) {
      next.quantityMoved = `Exceeds available stock (${available}).`;
    }
  }
  return next;
}

// Reusable create-a-transaction form. Pass products/warehouses/transactions (page usage) or
// set selfLoad to fetch them internally (modal usage). onCreated() runs after a successful save.
export default function TransactionForm({
  products: pProducts,
  warehouses: pWarehouses,
  transactions: pTransactions,
  onCreated,
  selfLoad = false,
}) {
  const [selfData, setSelfData] = useState({ products: [], warehouses: [], transactions: [] });

  const loadSelf = useCallback(async () => {
    try {
      const [p, w, t] = await Promise.all([getAllProducts(), getAllWarehouses(), getAllTransactions()]);
      setSelfData({ products: p, warehouses: w, transactions: t });
    } catch (err) {
      toast.error(extractError(err));
    }
  }, []);

  useEffect(() => {
    if (selfLoad) loadSelf();
  }, [selfLoad, loadSelf]);

  const products = selfLoad ? selfData.products : pProducts || [];
  const warehouses = selfLoad ? selfData.warehouses : pWarehouses || [];
  const transactions = selfLoad ? selfData.transactions : pTransactions || [];

  const [form, setForm] = useState(EMPTY_TRANSACTION);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const available = useMemo(
    () => (form.product ? computeAvailable(form.product, products, transactions) : null),
    [form.product, products, transactions]
  );

  const noEntities = products.length === 0 || warehouses.length === 0;

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError('');
    const next = validateTransactionValues(form, products, transactions);
    setErrors(next);
    if (!Object.values(next).every((v) => !v)) {
      toast.error('Please fix the highlighted fields');
      return;
    }
    setSubmitting(true);
    try {
      await createTransaction({ ...form, quantityMoved: Number(form.quantityMoved) });
      toast.success('Transaction added successfully');
      setForm(EMPTY_TRANSACTION);
      setErrors({});
      if (selfLoad) await loadSelf(); // keep available-stock figures current for repeat entries
      onCreated?.();
    } catch (err) {
      const message = extractError(err);
      setServerError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {noEntities && (
        <Alert variant="info" className="mb-4">
          <AlertDescription>Add at least one product and one warehouse before recording transactions.</AlertDescription>
        </Alert>
      )}
      {serverError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="product">Product</Label>
          <Select value={form.product} onValueChange={(v) => setForm({ ...form, product: v })}>
            <SelectTrigger id="product">
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
          {errors.product && <p role="alert" className="text-xs text-[var(--color-danger)]">{errors.product}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="warehouse">Warehouse</Label>
          <Select value={form.warehouse} onValueChange={(v) => setForm({ ...form, warehouse: v })}>
            <SelectTrigger id="warehouse">
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
          {errors.warehouse && <p role="alert" className="text-xs text-[var(--color-danger)]">{errors.warehouse}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="transactionType">Transaction Type</Label>
          <Select value={form.transactionType} onValueChange={(v) => setForm({ ...form, transactionType: v })}>
            <SelectTrigger id="transactionType">
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
          {errors.transactionType && <p role="alert" className="text-xs text-[var(--color-danger)]">{errors.transactionType}</p>}
        </div>

        <FormField
          id="quantityMoved"
          label="Quantity Moved"
          type="number"
          min="1"
          value={form.quantityMoved}
          error={errors.quantityMoved}
          hint={form.product && available !== null ? `Available stock: ${formatNumber(available)}` : undefined}
          onChange={(e) => setForm({ ...form, quantityMoved: e.target.value })}
        />

        <FormField
          id="transactionDate"
          label="Transaction Date"
          type="date"
          max={todayISO()}
          value={form.transactionDate}
          error={errors.transactionDate}
          onChange={(e) => setForm({ ...form, transactionDate: e.target.value })}
        />

        <Button type="submit" className="w-full" disabled={submitting || noEntities}>
          {submitting && <CircleNotch size={16} className="animate-spin" />}
          Add Transaction
        </Button>
      </form>
    </>
  );
}
