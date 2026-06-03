// Public page to reset a forgotten password using the 4-digit recovery code (verify, then set a new password).
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Eye, EyeSlash, CircleNotch, Key } from '@phosphor-icons/react';
import { toast } from 'sonner';

import * as authAPI from '@/api/authAPI';
import { extractError } from '@/api/axiosClient';
import { ROUTES, SYSTEM_NAME, SYSTEM_FULL_NAME } from '@/lib/constants';
import { validateRecoveryCode, validatePassword } from '@/lib/validators';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FormField, RecoveryCodeCard } from '@/components/common';

export default function RecoverPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState('verify'); // verify -> reset -> done
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [verifyForm, setVerifyForm] = useState({ username: '', recoveryCode: '' });
  const [verifyErrors, setVerifyErrors] = useState({});

  const [resetForm, setResetForm] = useState({ newPassword: '', confirmPassword: '' });
  const [resetErrors, setResetErrors] = useState({});

  const [newCode, setNewCode] = useState(null);

  async function handleVerify(e) {
    e.preventDefault();
    setServerError('');
    const errors = {
      username: verifyForm.username.trim() ? '' : 'Username or email is required.',
      recoveryCode: validateRecoveryCode(verifyForm.recoveryCode),
    };
    setVerifyErrors(errors);
    if (errors.username || errors.recoveryCode) return;

    setSubmitting(true);
    try {
      await authAPI.recoverVerify({
        username: verifyForm.username.trim(),
        recoveryCode: verifyForm.recoveryCode.trim(),
      });
      setStep('reset');
    } catch (err) {
      const message = extractError(err);
      setServerError(message);
      toast.error('Invalid details');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReset(e) {
    e.preventDefault();
    setServerError('');
    const errors = {
      newPassword: validatePassword(resetForm.newPassword),
      confirmPassword: resetForm.confirmPassword !== resetForm.newPassword ? 'Passwords do not match.' : '',
    };
    setResetErrors(errors);
    if (errors.newPassword || errors.confirmPassword) return;

    setSubmitting(true);
    try {
      const data = await authAPI.recoverReset({
        username: verifyForm.username.trim(),
        recoveryCode: verifyForm.recoveryCode.trim(),
        newPassword: resetForm.newPassword,
      });
      toast.success('Password reset — sign in');
      toast('Save your recovery code — it won’t be shown again');
      setNewCode(data.recoveryCode);
      setStep('done');
    } catch (err) {
      const message = extractError(err);
      setServerError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-bg)]">
      <div className="h-2 w-full bg-[var(--color-accent)]" />
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
        <Link
          to={ROUTES.login}
          className="mb-6 inline-flex items-center gap-1 text-sm text-[var(--color-muted)] hover:text-[var(--color-accent)]"
        >
          <ArrowLeft size={16} />
          Back to Sign In
        </Link>

        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-accent)] text-white">
            <Key size={22} />
          </span>
          <div>
            <h1 className="text-xl font-bold">Account recovery</h1>
            <p className="text-sm text-[var(--color-muted)]">
              {SYSTEM_FULL_NAME} ({SYSTEM_NAME})
            </p>
          </div>
        </div>

        {step === 'done' && newCode ? (
          <RecoveryCodeCard code={newCode} username={verifyForm.username.trim()} onContinue={() => navigate(ROUTES.login)} />
        ) : (
          <Card>
            <CardContent className="p-6">
              {serverError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{serverError}</AlertDescription>
                </Alert>
              )}

              {step === 'verify' ? (
                <form onSubmit={handleVerify} className="flex flex-col gap-4">
                  <FormField
                    id="recover-username"
                    label="Username or Email"
                    value={verifyForm.username}
                    error={verifyErrors.username}
                    onChange={(e) => setVerifyForm({ ...verifyForm, username: e.target.value })}
                  />
                  <FormField
                    id="recover-code"
                    label="Recovery Code"
                    inputMode="numeric"
                    maxLength={4}
                    value={verifyForm.recoveryCode}
                    error={verifyErrors.recoveryCode}
                    hint="The 4-digit code you saved at registration"
                    onChange={(e) => setVerifyForm({ ...verifyForm, recoveryCode: e.target.value })}
                  />
                  <Button type="submit" disabled={submitting}>
                    {submitting && <CircleNotch size={16} className="animate-spin" />}
                    Verify code
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleReset} className="flex flex-col gap-4">
                  <div className="relative">
                    <FormField
                      id="recover-newPassword"
                      label="New Password"
                      type={showPassword ? 'text' : 'password'}
                      value={resetForm.newPassword}
                      error={resetErrors.newPassword}
                      onChange={(e) => setResetForm({ ...resetForm, newPassword: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-[34px] text-[var(--color-muted)]"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <FormField
                    id="recover-confirm"
                    label="Confirm New Password"
                    type={showPassword ? 'text' : 'password'}
                    value={resetForm.confirmPassword}
                    error={resetErrors.confirmPassword}
                    onChange={(e) => setResetForm({ ...resetForm, confirmPassword: e.target.value })}
                  />
                  <Button type="submit" disabled={submitting}>
                    {submitting && <CircleNotch size={16} className="animate-spin" />}
                    Reset password
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
