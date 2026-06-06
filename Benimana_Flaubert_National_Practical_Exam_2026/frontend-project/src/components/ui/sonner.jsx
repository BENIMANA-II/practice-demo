import { Toaster as SonnerToaster } from "sonner";

// One global toaster, mounted once in App.
export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      richColors
      toastOptions={{
        style: { fontFamily: "Outfit, sans-serif" },
      }}
    />
  );
}
