// The "create a warehouse" form. Used on the Warehouses page and in the dashboard's quick-action modal.
import { useState } from 'react';
import { CircleNotch } from '@phosphor-icons/react';
import { toast } from 'sonner';

import { createWarehouse } from '@/api/warehouseAPI';
import { extractError } from '@/api/axiosClient';
import { validateRequired } from '@/lib/validators';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FormField } from '@/components/common';

export const EMPTY_WAREHOUSE = { warehouseCode: '', warehouseName: '', warehouseLocation: '' };

export function validateWarehouseForm(form) {
  return {
    warehouseCode: validateRequired(form.warehouseCode, 'Warehouse code'),
    warehouseName: validateRequired(form.warehouseName, 'Warehouse name'),
    warehouseLocation: validateRequired(form.warehouseLocation, 'Warehouse location'),
  };
}

// Reusable create-a-warehouse form. onCreated() runs after a successful save.
export default function WarehouseForm({ onCreated }) {
  const [form, setForm] = useState(EMPTY_WAREHOUSE);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError('');
    const next = validateWarehouseForm(form);
    setErrors(next);
    if (!Object.values(next).every((v) => !v)) {
      toast.error('Please fix the highlighted fields');
      return;
    }
    setSubmitting(true);
    try {
      await createWarehouse(form);
      toast.success('Warehouse added successfully');
      setForm(EMPTY_WAREHOUSE);
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
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField id="warehouseCode" label="Warehouse Code" value={form.warehouseCode} error={errors.warehouseCode} onChange={(e) => setField('warehouseCode', e.target.value)} />
        <FormField id="warehouseName" label="Warehouse Name" value={form.warehouseName} error={errors.warehouseName} onChange={(e) => setField('warehouseName', e.target.value)} />
        <FormField id="warehouseLocation" label="Warehouse Location" value={form.warehouseLocation} error={errors.warehouseLocation} onChange={(e) => setField('warehouseLocation', e.target.value)} />
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting && <CircleNotch size={16} className="animate-spin" />}
          Add Warehouse
        </Button>
      </form>
    </>
  );
}
