// Products page: create form on the left; searchable, paginated list with edit & delete on the right.
import { useState, useEffect, useCallback, useMemo } from 'react';
import { CircleNotch, Package, MagnifyingGlass, PencilSimple, Trash } from '@phosphor-icons/react';
import { toast } from 'sonner';

import { getAllProducts, updateProduct, deleteProduct } from '@/api/productAPI';
import { getAllTransactions } from '@/api/transactionAPI';
import { extractError } from '@/api/axiosClient';
import { todayISO } from '@/lib/validators';
import { formatDate, formatNumber, formatCurrency, formatCompactCurrency } from '@/lib/format';
import { computeAvailable } from '@/lib/stock';
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
import ProductForm, { EMPTY_PRODUCT, validateProductForm, productToPayload } from '@/components/ProductForm';
import {
  PageWrapper,
  FormField,
  StateBlock,
  Pagination,
  usePagination,
  useMeasuredHeight,
  useMediaQuery,
} from '@/components/common';

export default function ProductPage() {
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]); // used to work out the live "In Stock" amount
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [search, setSearch] = useState('');

  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_PRODUCT);
  const [editErrors, setEditErrors] = useState({});
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);

  const [formRef, formHeight] = useMeasuredHeight();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const allCardStyle = isDesktop && formHeight ? { height: formHeight } : undefined;

  const visibleProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return products;
    return products.filter((p) =>
      [p.productCode, p.productName, p.category, p.supplierName]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(term))
    );
  }, [products, search]);

  const { page, setPage, totalPages, pageItems, total, pageSize } = usePagination(visibleProducts, 6);

  // Load products and transactions together so we can show base stock + stock-in - stock-out.
  const loadProducts = useCallback(async () => {
    setLoading(true);
    setListError('');
    try {
      const [productData, transactionData] = await Promise.all([getAllProducts(), getAllTransactions()]);
      setProducts(productData);
      setTransactions(transactionData);
    } catch (err) {
      console.error(err);
      setListError(extractError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  function openEdit(p) {
    setEditing(p);
    setEditErrors({});
    setEditForm({
      productCode: p.productCode,
      productName: p.productName,
      category: p.category,
      quantityInStock: String(p.quantityInStock),
      unitPrice: String(p.unitPrice),
      supplierName: p.supplierName,
      dateReceived: new Date(p.dateReceived).toISOString().split('T')[0],
    });
  }

  async function handleUpdate(e) {
    e.preventDefault();
    const next = validateProductForm(editForm);
    setEditErrors(next);
    if (!Object.values(next).every((v) => !v)) {
      toast.error('Please fix the highlighted fields');
      return;
    }
    setEditSubmitting(true);
    try {
      await updateProduct(editing._id, productToPayload(editForm));
      toast.success('Product updated successfully');
      setEditing(null);
      await loadProducts();
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteProduct(deleteTarget._id);
      toast.success('Product deleted');
      setDeleteTarget(null);
      await loadProducts();
    } catch (err) {
      toast.error(extractError(err));
    }
  }

  return (
    <PageWrapper>
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-accent)] text-white">
          <Package size={22} />
        </span>
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-[var(--color-muted)]">Register, edit and remove products in the catalogue.</p>
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,360px)_1fr]">
        <Card ref={formRef}>
          <CardHeader>
            <CardTitle>New Product</CardTitle>
            <CardDescription>All fields are required.</CardDescription>
          </CardHeader>
          <CardContent>
            <ProductForm onCreated={loadProducts} />
          </CardContent>
        </Card>

        <Card style={allCardStyle} className="flex flex-col overflow-hidden">
          <CardHeader className="shrink-0">
            <CardTitle>All Products</CardTitle>
            <CardDescription>Products currently in your catalogue.</CardDescription>
            <div className="relative pt-2">
              <MagnifyingGlass size={16} className="absolute left-3 top-[18px] text-[var(--color-muted)]" />
              <Input className="pl-9" placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 overflow-y-auto">
            <StateBlock
              loading={loading}
              error={listError}
              onRetry={loadProducts}
              empty={!loading && !listError && visibleProducts.length === 0}
              emptyMessage={search ? 'No products match your search.' : 'No products yet.'}
            >
              <Table className="[&_td]:px-2 [&_td]:py-2 [&_th]:px-2">
                <TableHeader className="sticky-head">
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Base Stock</TableHead>
                    <TableHead className="text-right">In Stock</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead>Received</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageItems.map((p) => (
                    <TableRow key={p._id}>
                      <TableCell>{p.productCode}</TableCell>
                      <TableCell>{p.productName}</TableCell>
                      <TableCell>{p.category}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumber(p.quantityInStock)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumber(computeAvailable(p._id, products, transactions))}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(p.unitPrice)}</TableCell>
                      <TableCell className="text-right tabular-nums font-medium">{formatCompactCurrency(computeAvailable(p._id, products, transactions) * p.unitPrice)}</TableCell>
                      <TableCell>{formatDate(p.dateReceived)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="icon" aria-label="Edit product" onClick={() => openEdit(p)}>
                            <PencilSimple size={16} />
                          </Button>
                          <Button variant="outline" size="icon" aria-label="Delete product" onClick={() => setDeleteTarget(p)}>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="grid gap-4 sm:grid-cols-2">
            <FormField id="edit-productCode" label="Product Code" value={editForm.productCode} error={editErrors.productCode} onChange={(e) => setEditForm({ ...editForm, productCode: e.target.value })} />
            <FormField id="edit-productName" label="Product Name" value={editForm.productName} error={editErrors.productName} onChange={(e) => setEditForm({ ...editForm, productName: e.target.value })} />
            <FormField id="edit-category" label="Category" value={editForm.category} error={editErrors.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} />
            <FormField id="edit-supplierName" label="Supplier Name" value={editForm.supplierName} error={editErrors.supplierName} onChange={(e) => setEditForm({ ...editForm, supplierName: e.target.value })} />
            <FormField id="edit-quantityInStock" label="Quantity In Stock" type="number" min="0" value={editForm.quantityInStock} error={editErrors.quantityInStock} onChange={(e) => setEditForm({ ...editForm, quantityInStock: e.target.value })} />
            <FormField id="edit-unitPrice" label="Unit Price (RWF)" type="number" min="0" step="0.01" value={editForm.unitPrice} error={editErrors.unitPrice} onChange={(e) => setEditForm({ ...editForm, unitPrice: e.target.value })} />
            <FormField id="edit-dateReceived" label="Date Received" type="date" max={todayISO()} value={editForm.dateReceived} error={editErrors.dateReceived} onChange={(e) => setEditForm({ ...editForm, dateReceived: e.target.value })} />
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
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes “{deleteTarget?.productName}”. A product that has stock transactions cannot be deleted.
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
