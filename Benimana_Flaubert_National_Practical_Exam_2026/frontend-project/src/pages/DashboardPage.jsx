import { useState } from "react";
import { Users, Car, ClipboardText, CurrencyDollar, Plus } from "@phosphor-icons/react";
import { toast } from "sonner";
import { PageWrapper, StateBlock } from "@/components/common";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useFetch } from "@/hooks/useFetch";
import { useAuth } from "@/context/AuthContext";
import { reportsAPI } from "@/api/reportsAPI";
import { customerAPI } from "@/api/customerAPI";
import { vehicleAPI } from "@/api/vehicleAPI";
import { reservationAPI } from "@/api/reservationAPI";
import { formatMoney, formatNumber, formatDate } from "@/lib/format";
import CustomerForm from "@/components/CustomerForm";
import VehicleForm from "@/components/VehicleForm";
import ReservationForm from "@/components/ReservationForm";

export default function DashboardPage() {
  const { user } = useAuth();
  const isAdmin = user?.Role === "admin";
  const { data, loading, error, refetch } = useFetch(() => reportsAPI.dashboard(), []);
  const [openEntity, setOpenEntity] = useState(null); // "customer" | "vehicle" | "reservation"
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  // Reservation quick-action needs customer + vehicle lists for its dropdowns.
  async function openReservation() {
    try {
      const [c, v] = await Promise.all([customerAPI.list(""), vehicleAPI.list("")]);
      setCustomers(c.data.data);
      setVehicles(v.data.data);
      setOpenEntity("reservation");
    } catch {
      toast.error("Could not load customers/vehicles");
    }
  }

  async function afterCreate(label) {
    setOpenEntity(null);
    toast.success(`${label} created`);
    await refetch();
  }

  const counts = data?.counts;

  const STATS = [
    { label: "Customers", value: counts?.customers, icon: Users },
    { label: "Vehicles", value: counts?.vehicles, icon: Car },
    { label: "Available Vehicles", value: counts?.availableVehicles, icon: Car },
    { label: "Reservations", value: counts?.reservations, icon: ClipboardText },
  ];

  return (
    <PageWrapper title="Dashboard" description="Real-time overview of your fleet and rentals.">
      {(loading || error) && <StateBlock loading={loading} error={error} />}

      {data && (
        <>
          {/* Stat cards */}
          <div className="@container">
            <div className="grid grid-cols-1 gap-4 @sm:grid-cols-2 @lg:grid-cols-4">
              {STATS.map((s) => {
                const Icon = s.icon;
                return (
                  <Card key={s.label}>
                    {/* Square card; content centered top-to-bottom: name, icon, value. */}
                    <CardContent className="flex aspect-square flex-col items-center justify-center gap-3 p-5 text-center">
                      <p className="text-sm text-muted-foreground">{s.label}</p>
                      <Icon size={40} weight="duotone" className="text-primary" />
                      <p className="big-number text-3xl font-bold tabular-nums">
                        {formatNumber(s.value)}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Total rental fees (the SUM) */}
          <Card className="mt-4">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-muted-foreground">Total Rental Fees</p>
                <p className="big-number mt-1 text-3xl font-bold tabular-nums text-primary">
                  {formatMoney(data.totalRentalFees)}
                </p>
              </div>
              <CurrencyDollar size={32} weight="duotone" className="text-primary" />
            </CardContent>
          </Card>

          {/* Recent activity + Quick Actions */}
          <div className="@container mt-4">
            <div className="grid grid-cols-1 gap-4 @lg:grid-cols-3">
              <Card className="@lg:col-span-2">
                <CardHeader>
                  <CardTitle>Recent Reservations</CardTitle>
                </CardHeader>
                <CardContent>
                  {data.recent.length === 0 ? (
                    <StateBlock empty emptyText="No reservations yet." />
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Customer</TableHead>
                          <TableHead>Vehicle</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Rental</TableHead>
                          <TableHead className="text-right">Fee</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.recent.map((r) => (
                          <TableRow key={r.Reservation_ID}>
                            <TableCell className="font-medium">{r.Full_Name}</TableCell>
                            <TableCell>{r.Plate_Number}</TableCell>
                            <TableCell>{formatDate(r.Reservation_Date)}</TableCell>
                            <TableCell><Badge variant="secondary">{r.Rental_Status}</Badge></TableCell>
                            <TableCell className="text-right tabular-nums">{formatMoney(r.Rental_Fee)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="@lg:col-span-1">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <QuickAction icon={Users} label="New Customer"
                    text="Register a renter" onClick={() => setOpenEntity("customer")} />
                  {/* Adding vehicles is admin-only. */}
                  {isAdmin && (
                    <QuickAction icon={Car} label="New Vehicle"
                      text="Add to the fleet" onClick={() => setOpenEntity("vehicle")} />
                  )}
                  <QuickAction icon={ClipboardText} label="New Reservation"
                    text="Book a rental" onClick={openReservation} />
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}

      {/* Quick-action dialogs reuse the entity forms */}
      <Dialog open={openEntity === "customer"} onOpenChange={(o) => !o && setOpenEntity(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Customer</DialogTitle></DialogHeader>
          <CustomerForm onSubmit={async (v) => { await customerAPI.create(v); await afterCreate("Customer"); }} />
        </DialogContent>
      </Dialog>

      <Dialog open={openEntity === "vehicle"} onOpenChange={(o) => !o && setOpenEntity(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Vehicle</DialogTitle></DialogHeader>
          <VehicleForm onSubmit={async (v) => { await vehicleAPI.create(v); await afterCreate("Vehicle"); }} />
        </DialogContent>
      </Dialog>

      <Dialog open={openEntity === "reservation"} onOpenChange={(o) => !o && setOpenEntity(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Reservation</DialogTitle></DialogHeader>
          <ReservationForm customers={customers} vehicles={vehicles}
            onSubmit={async (v) => { await reservationAPI.create(v); await afterCreate("Reservation"); }} />
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}

// Declared at module top level (not inside the page component).
function QuickAction({ icon: Icon, label, text, onClick }) {
  return (
    <Button variant="outline" onClick={onClick}
      className="h-auto w-full justify-start gap-3 py-3 text-left">
      <Icon size={22} weight="duotone" className="text-primary shrink-0" />
      <span className="flex flex-col">
        <span className="flex items-center gap-1 font-medium"><Plus size={12} /> {label}</span>
        <span className="text-xs text-muted-foreground">{text}</span>
      </span>
    </Button>
  );
}
