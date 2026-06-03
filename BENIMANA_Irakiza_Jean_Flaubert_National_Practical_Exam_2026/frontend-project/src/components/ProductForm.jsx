// The "create a product" form. Used on the Products page and in the dashboard's quick-action modal.
import { useState } from 'react';
import { CircleNotch } from '@phosphor-icons/react';
import { toast } from 'sonner';

import { createProduct } from '@/api/productAPI';
import { extractError } from '@/api/axiosClient';
import {
  validateRequired,
  validateNonNegativeInteger,
  validatePositiveNumber,
  todayISO,
} from '@/lib/validators';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FormField } from '@/components/common';

export const EMPTY_PRODUCT = {
  productCode: '',
  productName: '',
  category: '',
  quantityInStock: '',
  unitPrice: '',
  supplierName: '',
  dateReceived: '',
};

// Shared validation/payload helpers so the create form and the page's edit dialog stay in sync.
export function validateProductForm(form) {
  const next = {
    productCode: validateRequired(form.productCode, 'Product code'),
    productName: validateRequired(form.productName, 'Product name'),
    category: validateRequired(form.category, 'Category'),
    quantityInStock: validateNonNegativeInteger(form.quantityInStock, 'Quantity in stock'),
    unitPrice: validatePositiveNumber(form.unitPrice, 'Unit price'),
    supplierName: validateRequired(form.supplierName, 'Supplier name'),
    dateReceived: validateRequired(form.dateReceived, 'Date received'),
  };
  if (!next.dateReceived && form.dateReceived > todayISO()) {
    next.dateReceived = 'Date received cannot be in the future.';
  }
  return next;
}

export function productToPayload(form) {
  return { ...form, quantityInStock: Number(form.quantityInStock), unitPrice: Number(form.unitPrice) };
}

// Reusable create-a-product form. onCreated() runs after a successful save (refresh/close).
export default function ProductForm({ onCreated }) {
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError('');
    const next = validateProductForm(form);
    setErrors(next);
    if (!Object.values(next).every((v) => !v)) {
      toast.error('Please fix the highlighted fields');
      return;
    }
    setSubmitting(true);
    try {
      await createProduct(productToPayload(form));
      toast.success('Product added successfully');
      setForm(EMPTY_PRODUCT);
      setErrors({});
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
      {serverError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}
      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <FormField id="productCode" label="Product Code" value={form.productCode} error={errors.productCode} onChange={(e) => setField('productCode', e.target.value)} />
        <FormField id="productName" label="Product Name" value={form.productName} error={errors.productName} onChange={(e) => setField('productName', e.target.value)} />
        <FormField id="category" label="Category" value={form.category} error={errors.category} onChange={(e) => setField('category', e.target.value)} />
        <FormField id="supplierName" label="Supplier Name" value={form.supplierName} error={errors.supplierName} onChange={(e) => setField('supplierName', e.target.value)} />
        <FormField id="quantityInStock" label="Quantity In Stock" type="number" min="0" value={form.quantityInStock} error={errors.quantityInStock} onChange={(e) => setField('quantityInStock', e.target.value)} />
        <FormField id="unitPrice" label="Unit Price (RWF)" type="number" min="0" step="0.01" value={form.unitPrice} error={errors.unitPrice} onChange={(e) => setField('unitPrice', e.target.value)} />
        <FormField id="dateReceived" label="Date Received" type="date" max={todayISO()} value={form.dateReceived} error={errors.dateReceived} onChange={(e) => setField('dateReceived', e.target.value)} />
        <div className="sm:col-span-2">
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting && <CircleNotch size={16} className="animate-spin" />}
            Add Product
          </Button>
        </div>
      </form>
    </>
  );
}
