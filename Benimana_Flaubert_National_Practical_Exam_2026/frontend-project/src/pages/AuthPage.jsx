import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { SteeringWheel, Spinner, Copy, DownloadSimple, CheckCircle } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FormField } from "@/components/common";
import { useAuth } from "@/context/AuthContext";
import { SYSTEM_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const isRegister = location.pathname === "/register";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState(""); // shown once after sign up

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (isRegister) {
        const result = await register({ username, password });
        setRecoveryCode(result.recoveryCode);
        toast.success("Account created — awaiting admin approval");
      } else {
        await login({ username, password });
        toast.success("Welcome back");
        navigate("/dashboard");
      }
    } catch (err) {
      if (!err.response) setError("Unable to connect to the server. Please try again.");
      else setError(err.response.data?.error || "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  }

  function copyCode() {
    navigator.clipboard.writeText(recoveryCode);
    toast.success("Recovery code copied");
  }
  function downloadCode() {
    const blob = new Blob([`SwiftWheels VRS recovery code: ${recoveryCode}`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vrs-recovery-code.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  // After a successful sign-up: show the one-time recovery code screen.
  if (recoveryCode) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-lg border bg-card p-8 shadow-accent">
          <CheckCircle size={40} weight="fill" className="mx-auto text-primary" />
          <h2 className="mt-4 text-center text-xl font-bold">Save your recovery code</h2>
          <p className="mt-1 text-center text-sm text-muted-foreground">
            You will need this 4-digit code to reset your password. It is shown only once.
          </p>
          <div className="my-6 rounded-lg border-2 border-dashed border-primary py-6 text-center text-4xl font-bold tracking-[0.3em] text-primary tabular-nums">
            {recoveryCode}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={copyCode}>
              <Copy size={16} /> Copy
            </Button>
            <Button variant="outline" className="flex-1" onClick={downloadCode}>
              <DownloadSimple size={16} /> Download
            </Button>
          </div>
          {/* New accounts are pending until an admin approves them. */}
          <Alert className="mt-4">
            <AlertDescription>
              Your account is <strong>pending admin approval</strong>. You can sign in once an
              administrator approves it.
            </AlertDescription>
          </Alert>
          <Button
            className="mt-4 w-full"
            onClick={() => {
              // Clear the one-time-code view (this component is shared by
              // /login and /register, so it does not remount on navigate).
              setRecoveryCode("");
              setUsername("");
              setPassword("");
              navigate("/login");
            }}
          >
            I've saved it — Go to Sign In
          </Button>
          <Link
            to="/"
            onClick={() => setRecoveryCode("")}
            className="mt-3 block text-center text-sm text-muted-foreground hover:text-primary"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="@container w-full max-w-4xl">
        <div className="grid grid-cols-1 overflow-hidden rounded-lg border bg-card shadow-accent @lg:grid-cols-2">
          {/* Accent showcase panel */}
          <div className="hidden flex-col justify-between bg-primary p-8 text-primary-foreground @lg:flex">
            <div className="flex items-center gap-2">
              <SteeringWheel size={28} weight="fill" />
              <span className="font-bold">{SYSTEM_NAME}</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                SwiftWheels Vehicle Rental & Reservation
              </h2>
              <p className="mt-2 text-sm text-primary-foreground/80">
                Manage your fleet, customers and rentals in real time.
              </p>
            </div>
            <span className="text-xs text-primary-foreground/70">Huye City · Southern Province</span>
          </div>

          {/* Form panel */}
          <div className="p-8">
            {/* Segmented tabs derived from the URL */}
            <div className="mb-6 grid grid-cols-2 rounded-md bg-muted p-1 text-sm font-medium">
              <Link to="/login"
                className={cn("rounded-sm py-1.5 text-center", !isRegister && "bg-card shadow-accent")}>
                Sign In
              </Link>
              <Link to="/register"
                className={cn("rounded-sm py-1.5 text-center", isRegister && "bg-card shadow-accent")}>
                Sign Up
              </Link>
            </div>

            <h1 className="text-xl font-bold">{isRegister ? "Create account" : "Sign in"}</h1>
            <p className="mb-4 text-sm text-muted-foreground">
              {isRegister ? "Register a staff account to start." : "Enter your credentials to continue."}
            </p>

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <FormField label="Username" name="username" value={username}
                onChange={(e) => setUsername(e.target.value)} placeholder="yourname" />
              <FormField label="Password" name="password" type="password" value={password}
                onChange={(e) => setPassword(e.target.value)} placeholder="••••••" />
              <Button type="submit" disabled={submitting}>
                {submitting && <Spinner size={16} className="animate-spin" />}
                {isRegister ? "Create account" : "Sign in"}
              </Button>
            </form>

            {!isRegister && (
              <p className="mt-4 text-center text-sm text-muted-foreground">
                Forgot password?{" "}
                <Link to="/recover" className="font-medium text-primary hover:underline">
                  Recover here
                </Link>
              </p>
            )}

            <Link
              to="/"
              className="mt-4 block text-center text-sm text-muted-foreground hover:text-primary"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
