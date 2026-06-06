import { useState } from "react";
import { Spinner } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FormField } from "@/components/common";
import { validateCustomer } from "@/lib/validators";

const EMPTY = { Full_Name: "", National_ID: "", Phone: "", Email: "", Address: "" };

// Create/edit form for a Customer. `onSubmit` performs the API call and may throw.
export default function CustomerForm({ initial, onSubmit, submitLabel = "Save Customer" }) {
  const [values, setValues] = useState(initial ? { ...EMPTY, ...initial } : EMPTY);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError("");
    const found = validateCustomer(values);
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      await onSubmit(values);
      if (!initial) setValues(EMPTY); // reset after a create
    } catch (err) {
      setServerError(err?.response?.data?.error || "Could not save customer");
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
      <FormField label="Full Name" name="Full_Name" value={values.Full_Name}
        onChange={handleChange} error={errors.Full_Name} placeholder="John Doe" />
      <FormField label="National ID" name="National_ID" value={values.National_ID}
        onChange={handleChange} error={errors.National_ID} placeholder="16 digits" />
      <FormField label="Phone" name="Phone" value={values.Phone}
        onChange={handleChange} error={errors.Phone} placeholder="0788123456" />
      <FormField label="Email" name="Email" type="email" value={values.Email}
        onChange={handleChange} error={errors.Email} placeholder="name@example.com" />
      <FormField label="Address" name="Address" value={values.Address}
        onChange={handleChange} error={errors.Address} placeholder="Huye, Southern Province" />

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting && <Spinner size={16} className="animate-spin" />}
        {submitLabel}
      </Button>
    </form>
  );
}
