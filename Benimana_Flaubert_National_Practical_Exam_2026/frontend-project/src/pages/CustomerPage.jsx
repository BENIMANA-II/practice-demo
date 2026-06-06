import { useState, useMemo } from "react";
import { MagnifyingGlass, PencilSimple, Trash, ArrowsDownUp } from "@phosphor-icons/react";
import { toast } from "sonner";
import { PageWrapper, StateBlock, paginate, Pagination } from "@/components/common";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useFetch } from "@/hooks/useFetch";
import { customerAPI } from "@/api/customerAPI";
import CustomerForm from "@/components/CustomerForm";

const PER_PAGE = 8;

export default function CustomerPage() {
  const { data, loading, error, refetch } = useFetch(() => customerAPI.list(""), []);
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const rows = data || [];

  // Client-side search + sort by name (list-handling function).
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    let list = rows.filter((c) =>
      [c.Full_Name, c.National_ID, c.Phone, c.Email].join(" ").toLowerCase().includes(term)
    );
    list = [...list].sort((a, b) =>
      sortAsc ? a.Full_Name.localeCompare(b.Full_Name) : b.Full_Name.localeCompare(a.Full_Name)
    );
    return list;
  }, [rows, search, sortAsc]);

  const { slice, pages, safePage } = paginate(filtered, page, PER_PAGE);

  async function handleDelete() {
    try {
      await customerAPI.remove(deleting.Customer_ID);
      toast.success("Customer deleted");
      setDeleting(null);
      await refetch();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Could not delete customer");
    }
  }

  return (
    <PageWrapper title="Customers" description="Manage the people who rent your vehicles.">
      <div className="@container">
        <div className="grid grid-cols-1 gap-4 @lg:grid-cols-2">
          {/* New Customer */}
          <Card>
            <CardHeader><CardTitle>New Customer</CardTitle></CardHeader>
            <CardContent>
              <CustomerForm
                onSubmit={async (v) => {
                  await customerAPI.create(v);
                  toast.success("Customer created");
                  await refetch();
                }}
              />
            </CardContent>
          </Card>

          {/* All Customers */}
          <Card>
            <CardHeader>
              <CardTitle>All Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-3 flex items-center gap-2">
                <div className="relative flex-1">
                  <MagnifyingGlass size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input className="pl-8" placeholder="Search customers…"
                    value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
                </div>
                <Button variant="outline" size="sm" onClick={() => setSortAsc((s) => !s)}>
                  <ArrowsDownUp size={16} /> Name
                </Button>
              </div>

              {(loading || error || filtered.length === 0) ? (
                <StateBlock loading={loading} error={error} empty={!loading && !error && filtered.length === 0}
                  emptyText="No customers found." />
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>National ID</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {slice.map((c) => (
                        <TableRow key={c.Customer_ID}>
                          <TableCell className="font-medium">{c.Full_Name}</TableCell>
                          <TableCell className="tabular-nums">{c.National_ID}</TableCell>
                          <TableCell className="tabular-nums">{c.Phone}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => setEditing(c)}>
                                <PencilSimple size={16} />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => setDeleting(c)}>
                                <Trash size={16} className="text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Pagination page={safePage} pages={pages}
                    onPrev={() => setPage((p) => p - 1)} onNext={() => setPage((p) => p + 1)} />
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit dialog */}
      <Dialog open={Boolean(editing)} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Customer</DialogTitle></DialogHeader>
          {editing && (
            <CustomerForm initial={editing} submitLabel="Update Customer"
              onSubmit={async (v) => {
                await customerAPI.update(editing.Customer_ID, v);
                toast.success("Customer updated");
                setEditing(null);
                await refetch();
              }} />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={Boolean(deleting)} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete customer?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {deleting?.Full_Name}. This cannot be undone.
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
