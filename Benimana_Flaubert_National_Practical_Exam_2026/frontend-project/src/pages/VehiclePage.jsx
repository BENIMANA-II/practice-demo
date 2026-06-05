import { useState, useMemo } from "react";
import { MagnifyingGlass, PencilSimple, Trash, ArrowsDownUp } from "@phosphor-icons/react";
import { toast } from "sonner";
import { PageWrapper, StateBlock, paginate, Pagination } from "@/components/common";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useFetch } from "@/hooks/useFetch";
import { vehicleAPI } from "@/api/vehicleAPI";
import { formatMoney } from "@/lib/format";
import { useAuth } from "@/context/AuthContext";
import VehicleForm from "@/components/VehicleForm";

const PER_PAGE = 8;

function statusVariant(status) {
  if (status === "Available") return "success";
  if (status === "Maintenance") return "destructive";
  return "warning";
}

export default function VehiclePage() {
  // Only admins can create/edit/delete vehicles; everyone else is read-only.
  const { user } = useAuth();
  const isAdmin = user?.Role === "admin";

  const { data, loading, error, refetch } = useFetch(() => vehicleAPI.list(""), []);
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const rows = data || [];

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    let list = rows.filter((v) =>
      [v.Plate_Number, v.Brand, v.Model, v.Vehicle_Type, v.Status].join(" ").toLowerCase().includes(term)
    );
    list = [...list].sort((a, b) =>
      sortAsc ? a.Brand.localeCompare(b.Brand) : b.Brand.localeCompare(a.Brand)
    );
    return list;
  }, [rows, search, sortAsc]);

  const { slice, pages, safePage } = paginate(filtered, page, PER_PAGE);

  async function handleDelete() {
    try {
      await vehicleAPI.remove(deleting.Plate_Number);
      toast.success("Vehicle deleted");
      setDeleting(null);
      await refetch();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Could not delete vehicle");
    }
  }

  return (
    <PageWrapper
      title="Vehicles"
      description={isAdmin ? "Manage your rental and sales fleet." : "Browse the available fleet (read-only)."}
    >
      <div className="@container">
        <div className={`grid grid-cols-1 gap-4 ${isAdmin ? "@lg:grid-cols-2" : ""}`}>
          {/* Create form is admin-only. */}
          {isAdmin && (
            <Card>
              <CardHeader><CardTitle>New Vehicle</CardTitle></CardHeader>
              <CardContent>
                <VehicleForm
                  onSubmit={async (v) => {
                    await vehicleAPI.create(v);
                    toast.success("Vehicle created");
                    await refetch();
                  }}
                />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>All Vehicles</CardTitle></CardHeader>
            <CardContent>
              <div className="mb-3 flex items-center gap-2">
                <div className="relative flex-1">
                  <MagnifyingGlass size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input className="pl-8" placeholder="Search vehicles…"
                    value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
                </div>
                <Button variant="outline" size="sm" onClick={() => setSortAsc((s) => !s)}>
                  <ArrowsDownUp size={16} /> Brand
                </Button>
              </div>

              {(loading || error || filtered.length === 0) ? (
                <StateBlock loading={loading} error={error} empty={!loading && !error && filtered.length === 0}
                  emptyText="No vehicles found." />
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Plate</TableHead>
                        <TableHead>Brand / Model</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {slice.map((v) => (
                        <TableRow key={v.Plate_Number}>
                          <TableCell className="font-medium">{v.Plate_Number}</TableCell>
                          <TableCell>{v.Brand} {v.Model} <span className="text-muted-foreground">({v.Year})</span></TableCell>
                          <TableCell><Badge variant={statusVariant(v.Status)}>{v.Status}</Badge></TableCell>
                          <TableCell className="text-right tabular-nums">{formatMoney(v.Purchase_Price)}</TableCell>
                          {isAdmin && (
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" onClick={() => setEditing(v)}>
                                  <PencilSimple size={16} />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => setDeleting(v)}>
                                  <Trash size={16} className="text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
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

      <Dialog open={Boolean(editing)} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Vehicle</DialogTitle></DialogHeader>
          {editing && (
            <VehicleForm initial={editing} submitLabel="Update Vehicle"
              onSubmit={async (v) => {
                await vehicleAPI.update(editing.Plate_Number, v);
                toast.success("Vehicle updated");
                setEditing(null);
                await refetch();
              }} />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleting)} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete vehicle?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {deleting?.Plate_Number}. This cannot be undone.
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
