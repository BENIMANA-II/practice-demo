import { useState } from "react";
import { Spinner } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { FormField } from "@/components/common";
import { validateVehicle } from "@/lib/validators";
import { VEHICLE_TYPES, VEHICLE_STATUS } from "@/lib/constants";

const EMPTY = {
  Plate_Number: "", Brand: "", Model: "", Year: "", Vehicle_Type: "",
  Purchase_Price: "", Status: "Available",
};

// Create/edit form for a Vehicle. Plate_Number is read-only when editing (it is the PK).
export default function VehicleForm({ initial, onSubmit, submitLabel = "Save Vehicle" }) {
  const isEdit = Boolean(initial);
  const [values, setValues] = useState(initial ? { ...EMPTY, ...initial } : EMPTY);
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
    const found = validateVehicle(values, !isEdit);
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      const payload = { ...values, Plate_Number: values.Plate_Number.toUpperCase() };
      await onSubmit(payload);
      if (!isEdit) setValues(EMPTY);
    } catch (err) {
      setServerError(err?.response?.data?.error || "Could not save vehicle");
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

      <FormField label="Plate Number" name="Plate_Number" value={values.Plate_Number}
        onChange={handleChange} error={errors.Plate_Number} placeholder="RAB 123 A"
        disabled={isEdit} />

      <div className="@container">
        <div className="grid grid-cols-1 gap-4 @sm:grid-cols-2">
          <FormField label="Brand" name="Brand" value={values.Brand}
            onChange={handleChange} error={errors.Brand} placeholder="Toyota" />
          <FormField label="Model" name="Model" value={values.Model}
            onChange={handleChange} error={errors.Model} placeholder="RAV4" />
          <FormField label="Year" name="Year" type="number" value={values.Year}
            onChange={handleChange} error={errors.Year} placeholder="2021" />
          <FormField label="Purchase Price (RWF)" name="Purchase_Price" type="number"
            value={values.Purchase_Price} onChange={handleChange}
            error={errors.Purchase_Price} placeholder="28000000" />
        </div>
      </div>

      <FormField label="Vehicle Type" name="Vehicle_Type" error={errors.Vehicle_Type}>
        <Select value={values.Vehicle_Type} onValueChange={(v) => setField("Vehicle_Type", v)}>
          <SelectTrigger><SelectValue placeholder="Choose type" /></SelectTrigger>
          <SelectContent>
            {VEHICLE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </FormField>

      <FormField label="Status" name="Status" error={errors.Status}>
        <Select value={values.Status} onValueChange={(v) => setField("Status", v)}>
          <SelectTrigger><SelectValue placeholder="Choose status" /></SelectTrigger>
          <SelectContent>
            {VEHICLE_STATUS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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
