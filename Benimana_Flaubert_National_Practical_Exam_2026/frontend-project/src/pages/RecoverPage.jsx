import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SteeringWheel, Spinner, CheckCircle } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FormField } from "@/components/common";
import { authAPI } from "@/api/authAPI";
import { CODE_RE } from "@/lib/validators";
import { SYSTEM_NAME } from "@/lib/constants";

// Three steps: verify code -> set new password -> show the new one-time code.
export default function RecoverPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newCode, setNewCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function verify(e) {
    e.preventDefault();
    setError("");
    if (!username || !CODE_RE.test(code)) {
      setError("Enter your username and a valid 4-digit code");
      return;
    }
    setSubmitting(true);
    try {
      await authAPI.recoverVerify({ username, code });
      setStep(2);
    } catch (err) {
      if (!err.response) setError("Unable to connect to the server. Please try again.");
      else setError(err.response.data?.error || "Verification failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function reset(e) {
    e.preventDefault();
    setError("");
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setSubmitting(true);
    try {
      const res = await authAPI.recoverReset({ username, code, newPassword });
      setNewCode(res.data.data.recoveryCode);
      setStep(3);
      toast.success("Password reset");
    } catch (err) {
      if (!err.response) setError("Unable to connect to the server. Please try again.");
      else setError(err.response.data?.error || "Reset failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-8 shadow-accent">
        <div className="mb-6 flex items-center gap-2">
          <SteeringWheel size={24} weight="fill" className="text-primary" />
          <span className="font-bold">{SYSTEM_NAME}</span>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === 1 && (
          <form onSubmit={verify} className="flex flex-col gap-4">
            <h1 className="text-xl font-bold">Recover account</h1>
            <FormField label="Username" name="username" value={username}
              onChange={(e) => setUsername(e.target.value)} placeholder="yourname" />
            <FormField label="4-digit recovery code" name="code" value={code}
              onChange={(e) => setCode(e.target.value)} placeholder="0000" maxLength={4} />
            <Button type="submit" disabled={submitting}>
              {submitting && <Spinner size={16} className="animate-spin" />} Verify code
            </Button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={reset} className="flex flex-col gap-4">
            <h1 className="text-xl font-bold">Set a new password</h1>
            <FormField label="New password" name="newPassword" type="password" value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••" />
            <Button type="submit" disabled={submitting}>
              {submitting && <Spinner size={16} className="animate-spin" />} Reset password
            </Button>
          </form>
        )}

        {step === 3 && (
          <div className="text-center">
            <CheckCircle size={40} weight="fill" className="mx-auto text-primary" />
            <h1 className="mt-3 text-xl font-bold">Done!</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Your new recovery code (save it — shown once):
            </p>
            <div className="my-5 rounded-lg border-2 border-dashed border-primary py-5 text-3xl font-bold tracking-[0.3em] text-primary tabular-nums">
              {newCode}
            </div>
            <Button className="w-full" onClick={() => navigate("/login")}>
              Back to Sign In
            </Button>
          </div>
        )}

        {step !== 3 && (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Remembered it?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link>
          </p>
        )}

        <Link to="/" className="mt-3 block text-center text-sm text-muted-foreground hover:text-primary">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
