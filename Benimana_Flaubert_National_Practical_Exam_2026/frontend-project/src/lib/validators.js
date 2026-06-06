// Client-side validation mirrors the server rules.
export const NAME_RE = /^[A-Za-z]+([ '-][A-Za-z]+)*$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_RE = /^(078|079|073|072)\d{7}$/;
export const NATIONAL_ID_RE = /^\d{16}$/;
export const CODE_RE = /^\d{4}$/;
// Cars: RAB 123 A (3-letter prefix). Motorcycles: RL 123 A ("RL" prefix).
export const CAR_PLATE_RE = /^R[A-Z]{2} \d{3} [A-Z]$/;
export const MOTO_PLATE_RE = /^RL \d{3} [A-Z]$/;

export function isValidPlate(plate) {
  const p = (plate || "").trim().toUpperCase();
  return CAR_PLATE_RE.test(p) || MOTO_PLATE_RE.test(p);
}

// Local calendar date as YYYY-MM-DD (matches the server's day boundary).
export function todayStr() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

// Each validator returns "" when valid or a message when invalid.
export function validateCustomer(v) {
  const e = {};
  if (!NAME_RE.test((v.Full_Name || "").trim())) e.Full_Name = "Letters only, e.g. John Doe";
  if (!NATIONAL_ID_RE.test((v.National_ID || "").trim())) e.National_ID = "Must be 16 digits";
  if (!PHONE_RE.test((v.Phone || "").trim())) e.Phone = "10 digits, starts 078/079/073/072";
  if (!EMAIL_RE.test((v.Email || "").trim())) e.Email = "Enter a valid email";
  if (!(v.Address || "").trim()) e.Address = "Address is required";
  return e;
}

export function validateVehicle(v, isCreate) {
  const e = {};
  if (isCreate && !isValidPlate(v.Plate_Number))
    e.Plate_Number = "Format: RAB 123 A (car) or RL 123 A (motorcycle)";
  if (!(v.Brand || "").trim()) e.Brand = "Brand is required";
  if (!(v.Model || "").trim()) e.Model = "Model is required";
  const year = Number(v.Year);
  const current = new Date().getFullYear();
  if (!year || year < 1950 || year > current) e.Year = `Between 1950 and ${current}`;
  if (!(v.Vehicle_Type || "").trim()) e.Vehicle_Type = "Choose a type";
  if (!(Number(v.Purchase_Price) > 0)) e.Purchase_Price = "Must be greater than 0";
  if (!(v.Status || "").trim()) e.Status = "Choose a status";
  return e;
}

export function validateReservation(v) {
  const e = {};
  const today = todayStr();
  if (!v.Customer_ID) e.Customer_ID = "Choose a customer";
  if (!v.Plate_Number) e.Plate_Number = "Choose a vehicle";

  // Reservation date and start date must be today; end date today or future.
  if (!v.Reservation_Date) e.Reservation_Date = "Required";
  else if (v.Reservation_Date !== today) e.Reservation_Date = "Must be today";
  if (!v.Start_Date) e.Start_Date = "Required";
  else if (v.Start_Date !== today) e.Start_Date = "Must be today";
  if (!v.End_Date) e.End_Date = "Required";
  else if (v.End_Date < today) e.End_Date = "Must be today or a future date";

  // Rental date (if set) must be today; return date (if set) today or future.
  if (v.Rental_Date && v.Rental_Date !== today) e.Rental_Date = "Must be today";
  if (v.Return_Date && v.Return_Date < today) e.Return_Date = "Must be today or a future date";

  if (!(Number(v.Rental_Fee) >= 0)) e.Rental_Fee = "Must be 0 or more";
  if (!v.Reservation_Status) e.Reservation_Status = "Choose a status";
  if (!v.Rental_Status) e.Rental_Status = "Choose a status";
  return e;
}
