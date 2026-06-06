import { useState } from "react";
import { Spinner } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { FormField } from "@/components/common";
import { validateReservation, todayStr } from "@/lib/validators";
import { RESERVATION_STATUS, RENTAL_STATUS } from "@/lib/constants";

function emptyValues() {
  const today = todayStr();
  // Reservation, start and rental dates are fixed to today by the business rules.
  return {
    Customer_ID: "", Plate_Number: "",
    Reservation_Date: today, Start_Date: today, End_Date: today,
    Reservation_Status: "Pending",
    Rental_Date: today, Return_Date: "", Rental_Fee: "", Rental_Status: "Not Started",
  };
}

// Create/edit form for a Reservation_Rental. Needs customers + vehicles for dropdowns.
export default function ReservationForm({ initial, customers, vehicles, onSubmit, submitLabel = "Save Reservation" }) {
  const [values, setValues] = useState(
    initial
      ? {
          ...emptyValues(),
          ...initial,
          Customer_ID: String(initial.Customer_ID || ""),
          // Locked fields are always today, even when editing an older record.
          Reservation_Date: todayStr(),
          Start_Date: todayStr(),
          Rental_Date: todayStr(),
          End_Date: (initial.End_Date || "").slice(0, 10),
          Return_Date: (initial.Return_Date || "").slice(0, 10),
        }
      : emptyValues()
  );
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
  }
  function setField(name, value) {
    setValues((v) => ({ ...v, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError("");
    const found = validateReservation(values);
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      await onSubmit({ ...values, Customer_ID: Number(values.Customer_ID) });
      if (!initial) setValues(emptyValues());
    } catch (err) {
      setServerError(err?.response?.data?.error || "Could not save reservation");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {serverError && (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <FormField label="Customer" name="Customer_ID" error={errors.Customer_ID}>
        <Select value={values.Customer_ID} onValueChange={(v) => setField("Customer_ID", v)}>
          <SelectTrigger><SelectValue placeholder="Choose customer" /></SelectTrigger>
          <SelectContent>
            {customers.map((c) => (
              <SelectItem key={c.Customer_ID} value={String(c.Customer_ID)}>
                {c.Full_Name} — {c.National_ID}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <FormField label="Vehicle" name="Plate_Number" error={errors.Plate_Number}>
        <Select value={values.Plate_Number} onValueChange={(v) => setField("Plate_Number", v)}>
          <SelectTrigger><SelectValue placeholder="Choose vehicle" /></SelectTrigger>
          <SelectContent>
            {vehicles.map((v) => (
              <SelectItem key={v.Plate_Number} value={v.Plate_Number}>
                {v.Plate_Number} — {v.Brand} {v.Model}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <div className="@container">
        <div className="grid grid-cols-1 gap-4 @sm:grid-cols-3">
          {/* Reservation date and start date are fixed to today (read-only). */}
          <FormField label="Reservation Date (today)" name="Reservation_Date" type="date"
            value={values.Reservation_Date} readOnly error={errors.Reservation_Date} />
          <FormField label="Start Date (today)" name="Start_Date" type="date"
            value={values.Start_Date} readOnly error={errors.Start_Date} />
          {/* End date: today or any future date. */}
          <FormField label="End Date" name="End_Date" type="date" min={todayStr()}
            value={values.End_Date} onChange={handleChange} error={errors.End_Date} />
        </div>
      </div>

      <FormField label="Reservation Status" name="Reservation_Status" error={errors.Reservation_Status}>
        <Select value={values.Reservation_Status} onValueChange={(v) => setField("Reservation_Status", v)}>
          <SelectTrigger><SelectValue placeholder="Choose status" /></SelectTrigger>
          <SelectContent>
            {RESERVATION_STATUS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </FormField>

      <div className="@container">
        <div className="grid grid-cols-1 gap-4 @sm:grid-cols-3">
          {/* Rental date is fixed to today (read-only). */}
          <FormField label="Rental Date (today)" name="Rental_Date" type="date"
            value={values.Rental_Date} readOnly error={errors.Rental_Date} />
          {/* Return date: today or any future date (optional until returned). */}
          <FormField label="Return Date" name="Return_Date" type="date" min={todayStr()}
            value={values.Return_Date} onChange={handleChange} error={errors.Return_Date} />
          <FormField label="Rental Fee (RWF)" name="Rental_Fee" type="number"
            value={values.Rental_Fee} onChange={handleChange} error={errors.Rental_Fee} placeholder="150000" />
        </div>
      </div>

      <FormField label="Rental Status" name="Rental_Status" error={errors.Rental_Status}>
        <Select value={values.Rental_Status} onValueChange={(v) => setField("Rental_Status", v)}>
          <SelectTrigger><SelectValue placeholder="Choose status" /></SelectTrigger>
          <SelectContent>
            {RENTAL_STATUS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </FormField>

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting && <Spinner size={16} className="animate-spin" />}
        {submitLabel}
      </Button>
    </form>
  );
}
