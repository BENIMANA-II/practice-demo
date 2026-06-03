// Warehouses page: create form on the left; searchable, paginated list with edit & delete on the right.
import { useState, useEffect, useCallback, useMemo } from 'react';
import { CircleNotch, Warehouse as WarehouseIcon, MagnifyingGlass, PencilSimple, Trash } from '@phosphor-icons/react';
import { toast } from 'sonner';

import { getAllWarehouses, updateWarehouse, deleteWarehouse } from '@/api/warehouseAPI';
import { extractError } from '@/api/axiosClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
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
import WarehouseForm, { EMPTY_WAREHOUSE, validateWarehouseForm } from '@/components/WarehouseForm';
import {
  PageWrapper,
  FormField,
  StateBlock,
  Pagination,
  usePagination,
  useMeasuredHeight,
  useMediaQuery,
} from '@/components/common';

export default function WarehousePage() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [search, setSearch] = useState('');

  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_WAREHOUSE);
  const [editErrors, setEditErrors] = useState({});
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);

  const [formRef, formHeight] = useMeasuredHeight();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const allCardStyle = isDesktop && formHeight ? { height: formHeight } : undefined;

  const visibleWarehouses = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return warehouses;
    return warehouses.filter((w) =>
      [w.warehouseCode, w.warehouseName, w.warehouseLocation]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(term))
    );
  }, [warehouses, search]);

  const { page, setPage, totalPages, pageItems, total, pageSize } = usePagination(visibleWarehouses, 6);

  const loadWarehouses = useCallback(async () => {
    setLoading(true);
    setListError('');
    try {
      const data = await getAllWarehouses();
      setWarehouses(data);
    } catch (err) {
      console.error(err);
      setListError(extractError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWarehouses();
  }, [loadWarehouses]);

  function openEdit(w) {
    setEditing(w);
    setEditErrors({});
    setEditForm({
      warehouseCode: w.warehouseCode,
      warehouseName: w.warehouseName,
      warehouseLocation: w.warehouseLocation,
    });
  }

  async function handleUpdate(e) {
    e.preventDefault();
    const next = validateWarehouseForm(editForm);
    setEditErrors(next);
    if (!Object.values(next).every((v) => !v)) {
      toast.error('Please fix the highlighted fields');
      return;
    }
    setEditSubmitting(true);
    try {
      await updateWarehouse(editing._id, editForm);
      toast.success('Warehouse updated successfully');
      setEditing(null);
      await loadWarehouses();
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteWarehouse(deleteTarget._id);
      toast.success('Warehouse deleted');
      setDeleteTarget(null);
      await loadWarehouses();
    } catch (err) {
      toast.error(extractError(err));
    }
  }

  return (
    <PageWrapper>
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-accent)] text-white">
          <WarehouseIcon size={22} />
        </span>
        <div>
          <h1 className="text-2xl font-bold">Warehouses</h1>
          <p className="text-[var(--color-muted)]">Register, edit and remove warehouses.</p>
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card ref={formRef}>
          <CardHeader>
            <CardTitle>New Warehouse</CardTitle>
            <CardDescription>All fields are required.</CardDescription>
          </CardHeader>
          <CardContent>
            <WarehouseForm onCreated={loadWarehouses} />
          </CardContent>
        </Card>

        <Card style={allCardStyle} className="flex flex-col overflow-hidden">
          <CardHeader className="shrink-0">
            <CardTitle>All Warehouses</CardTitle>
            <CardDescription>Warehouses currently registered.</CardDescription>
            <div className="relative pt-2">
              <MagnifyingGlass size={16} className="absolute left-3 top-[18px] text-[var(--color-muted)]" />
              <Input className="pl-9" placeholder="Search warehouses…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 overflow-y-auto">
            <StateBlock
              loading={loading}
              error={listError}
              onRetry={loadWarehouses}
              empty={!loading && !listError && visibleWarehouses.length === 0}
              emptyMessage={search ? 'No warehouses match your search.' : 'No warehouses yet.'}
            >
              <Table>
                <TableHeader className="sticky-head">
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageItems.map((w) => (
                    <TableRow key={w._id}>
                      <TableCell>{w.warehouseCode}</TableCell>
                      <TableCell>{w.warehouseName}</TableCell>
                      <TableCell>{w.warehouseLocation}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="icon" aria-label="Edit warehouse" onClick={() => openEdit(w)}>
                            <PencilSimple size={16} />
                          </Button>
                          <Button variant="outline" size="icon" aria-label="Delete warehouse" onClick={() => setDeleteTarget(w)}>
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
            <DialogTitle>Edit Warehouse</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="flex flex-col gap-4">
            <FormField id="edit-warehouseCode" label="Warehouse Code" value={editForm.warehouseCode} error={editErrors.warehouseCode} onChange={(e) => setEditForm({ ...editForm, warehouseCode: e.target.value })} />
            <FormField id="edit-warehouseName" label="Warehouse Name" value={editForm.warehouseName} error={editErrors.warehouseName} onChange={(e) => setEditForm({ ...editForm, warehouseName: e.target.value })} />
            <FormField id="edit-warehouseLocation" label="Warehouse Location" value={editForm.warehouseLocation} error={editErrors.warehouseLocation} onChange={(e) => setEditForm({ ...editForm, warehouseLocation: e.target.value })} />
            <DialogFooter>
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
            <AlertDialogTitle>Delete this warehouse?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes “{deleteTarget?.warehouseName}”. A warehouse that has stock transactions cannot be deleted.
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
