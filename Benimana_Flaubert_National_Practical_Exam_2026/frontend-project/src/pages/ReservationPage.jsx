import { useState, useMemo, useEffect } from "react";
import { MagnifyingGlass, PencilSimple, Trash } from "@phosphor-icons/react";
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
import { reservationAPI } from "@/api/reservationAPI";
import { customerAPI } from "@/api/customerAPI";
import { vehicleAPI } from "@/api/vehicleAPI";
import { formatMoney, formatDate } from "@/lib/format";
import ReservationForm from "@/components/ReservationForm";

const PER_PAGE = 8;

export default function ReservationPage() {
  const { data, loading, error, refetch } = useFetch(() => reservationAPI.list(""), []);
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  // Load the dropdown sources once (customers + vehicles) for the form.
  useEffect(() => {
    Promise.all([customerAPI.list(""), vehicleAPI.list("")])
      .then(([c, v]) => {
        setCustomers(c.data.data);
        setVehicles(v.data.data);
      })
      .catch(() => toast.error("Could not load customers/vehicles"));
  }, []);

  const rows = data || [];

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((r) =>
      [r.Full_Name, r.National_ID, r.Plate_Number, r.Reservation_Status, r.Rental_Status]
        .join(" ").toLowerCase().includes(term)
    );
  }, [rows, search]);

  const { slice, pages, safePage } = paginate(filtered, page, PER_PAGE);

  async function handleDelete() {
    try {
      await reservationAPI.remove(deleting.Reservation_ID);
      toast.success("Reservation deleted");
      setDeleting(null);
      await refetch();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Could not delete reservation");
    }
  }

  return (
    <PageWrapper title="Reservations & Rentals" description="Record bookings and rentals.">
      <div className="@container">
        <div className="grid grid-cols-1 gap-4 @lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>New Reservation</CardTitle></CardHeader>
            <CardContent>
              {customers.length === 0 || vehicles.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Add at least one customer and one vehicle first.
                </p>
              ) : (
                <ReservationForm customers={customers} vehicles={vehicles}
                  onSubmit={async (v) => {
                    await reservationAPI.create(v);
                    toast.success("Reservation created");
                    await refetch();
                  }} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>All Reservations</CardTitle></CardHeader>
            <CardContent>
              <div className="mb-3 relative">
                <MagnifyingGlass size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-8" placeholder="Search reservations…"
                  value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
              </div>

              {(loading || error || filtered.length === 0) ? (
                <StateBlock loading={loading} error={error} empty={!loading && !error && filtered.length === 0}
                  emptyText="No reservations found." />
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Reserved</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Fee</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {slice.map((r) => (
                        <TableRow key={r.Reservation_ID}>
                          <TableCell className="font-medium">{r.Full_Name}</TableCell>
                          <TableCell>{r.Plate_Number}</TableCell>
                          <TableCell>{formatDate(r.Reservation_Date)}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{r.Reservation_Status}</Badge>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{formatMoney(r.Rental_Fee)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => setEditing(r)}>
                                <PencilSimple size={16} />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => setDeleting(r)}>
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

      <Dialog open={Boolean(editing)} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Reservation</DialogTitle></DialogHeader>
          {editing && (
            <ReservationForm initial={editing} customers={customers} vehicles={vehicles}
              submitLabel="Update Reservation"
              onSubmit={async (v) => {
                await reservationAPI.update(editing.Reservation_ID, v);
                toast.success("Reservation updated");
                setEditing(null);
                await refetch();
              }} />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleting)} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete reservation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this reservation record. This cannot be undone.
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
