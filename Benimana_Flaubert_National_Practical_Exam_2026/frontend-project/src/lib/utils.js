import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Merge conditional + tailwind classes (used by every shadcn component).
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
