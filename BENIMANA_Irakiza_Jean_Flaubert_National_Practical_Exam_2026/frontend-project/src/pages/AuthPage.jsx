// Public sign-in / sign-up page. One page with two tabs; the URL (/login or /register) picks the tab.
import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  SignIn as SignInIcon,
  UserPlus,
  Eye,
  EyeSlash,
  ArrowLeft,
  CircleNotch,
  Package,
  Warehouse as WarehouseIcon,
  ArrowsLeftRight,
  ChartBar,
} from '@phosphor-icons/react';
import { toast } from 'sonner';

import { useAuth } from '@/context/AuthContext';
import { extractError } from '@/api/axiosClient';
import { ROUTES, SYSTEM_NAME, SYSTEM_FULL_NAME, COMPANY_NAME } from '@/lib/constants';
import {
  validateFullName,
  validateEmail,
  validatePhone,
  validateUsername,
  validatePassword,
} from '@/lib/validators';

import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FormField, RecoveryCodeCard } from '@/components/common';

const SHOWCASE_ITEMS = [
  { icon: Package, label: 'Manage products' },
  { icon: WarehouseIcon, label: 'Track warehouses' },
  { icon: ArrowsLeftRight, label: 'Record stock movements' },
  { icon: ChartBar, label: 'Generate reports' },
];

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register } = useAuth();

  // Active segment is derived from the URL so back/forward and deep links stay correct.
  const activeTab = location.pathname === ROUTES.register ? 'signup' : 'signin';

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  // Sign In state
  const [signIn, setSignIn] = useState({ username: '', password: '' });

  // Sign Up state
  const [signUp, setSignUp] = useState({
    fullName: '',
    email: '',
    phone: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [signUpErrors, setSignUpErrors] = useState({});
  const [recovery, setRecovery] = useState(null); // { code, username }

  function switchTab(tab) {
    setServerError('');
    navigate(tab === 'signup' ? ROUTES.register : ROUTES.login);
  }

  async function handleSignIn(e) {
    e.preventDefault();
    setServerError('');
    if (!signIn.username.trim() || !signIn.password) {
      setServerError('Username and password are required.');
      return;
    }
    setSubmitting(true);
    try {
      const user = await login({ username: signIn.username.trim(), password: signIn.password });
      toast.success(`Welcome Back! ${user.username}`);
      navigate(ROUTES.dashboard);
    } catch (err) {
      const message = extractError(err);
      setServerError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  function validateSignUp() {
    const errors = {
      fullName: validateFullName(signUp.fullName),
      email: validateEmail(signUp.email),
      phone: validatePhone(signUp.phone),
      username: validateUsername(signUp.username),
      password: validatePassword(signUp.password),
      confirmPassword: signUp.confirmPassword !== signUp.password ? 'Passwords do not match.' : '',
    };
    setSignUpErrors(errors);
    return Object.values(errors).every((v) => !v);
  }

  async function handleSignUp(e) {
    e.preventDefault();
    setServerError('');
    if (!validateSignUp()) {
      toast.error('Please fix the highlighted fields');
      return;
    }
    setSubmitting(true);
    try {
      const data = await register({
        fullName: signUp.fullName.trim(),
        email: signUp.email.trim(),
        phone: signUp.phone.trim(),
        username: signUp.username.trim(),
        password: signUp.password,
      });
      toast.success(`Welcome ${data.user.username}`);
      toast('Save your recovery code — it won’t be shown again');
      setRecovery({ code: data.recoveryCode, username: data.user.username });
    } catch (err) {
      const message = extractError(err);
      setServerError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  // After registration, show the one-time recovery code before entering the app.
  if (recovery) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md">
          <RecoveryCodeCard
            code={recovery.code}
            username={recovery.username}
            onContinue={() => navigate(ROUTES.dashboard)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-2xl shadow-accent md:grid-cols-2">
        {/* Showcase (accent) panel */}
        <div className="flex flex-col justify-between bg-[var(--color-accent)] p-8 text-[var(--color-accent-foreground)]">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-accent-foreground)]">{SYSTEM_NAME}</h1>
            <p className="mt-2 text-sm opacity-90">
              {SYSTEM_FULL_NAME} for {COMPANY_NAME} — record stock digitally and generate reports instantly.
            </p>
          </div>
          <ul className="mt-8 flex flex-col gap-4">
            {SHOWCASE_ITEMS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3 text-sm">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
                  <Icon size={18} />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </div>

        {/* Form panel */}
        <div className="bg-[var(--color-surface)] p-6 sm:p-8">
          <Link
            to={ROUTES.landing}
            className="mb-4 inline-flex items-center gap-1 text-sm text-[var(--color-muted)] hover:text-[var(--color-accent)]"
          >
            <ArrowLeft size={16} />
            Back to home
          </Link>

          <Tabs value={activeTab} onValueChange={switchTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">
                <SignInIcon size={16} />
                Sign In
              </TabsTrigger>
              <TabsTrigger value="signup">
                <UserPlus size={16} />
                Sign Up
              </TabsTrigger>
            </TabsList>

            {serverError && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            )}

            {/* Sign In */}
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="flex flex-col gap-4">
                <FormField
                  id="signin-username"
                  label="Username"
                  value={signIn.username}
                  onChange={(e) => setSignIn({ ...signIn, username: e.target.value })}
                  autoComplete="username"
                />
                <div className="flex flex-col gap-1.5">
                  <div className="relative">
                    <FormField
                      id="signin-password"
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      value={signIn.password}
                      onChange={(e) => setSignIn({ ...signIn, password: e.target.value })}
                      autoComplete="current-password"
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
                  <Link to={ROUTES.recover} className="self-end text-sm text-[var(--color-accent)] hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Button type="submit" disabled={submitting}>
                  {submitting && <CircleNotch size={16} className="animate-spin" />}
                  Sign In
                </Button>
              </form>
            </TabsContent>

            {/* Sign Up */}
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="flex flex-col gap-4">
                <FormField
                  id="signup-fullName"
                  label="Full Name"
                  value={signUp.fullName}
                  error={signUpErrors.fullName}
                  onChange={(e) => setSignUp({ ...signUp, fullName: e.target.value })}
                  autoComplete="name"
                />
                <FormField
                  id="signup-email"
                  label="Email"
                  type="email"
                  value={signUp.email}
                  error={signUpErrors.email}
                  onChange={(e) => setSignUp({ ...signUp, email: e.target.value })}
                  autoComplete="email"
                />
                <FormField
                  id="signup-phone"
                  label="Phone Number"
                  value={signUp.phone}
                  error={signUpErrors.phone}
                  hint="10 digits starting 078, 079, 073 or 072"
                  onChange={(e) => setSignUp({ ...signUp, phone: e.target.value })}
                  autoComplete="tel"
                />
                <FormField
                  id="signup-username"
                  label="Username"
                  value={signUp.username}
                  error={signUpErrors.username}
                  onChange={(e) => setSignUp({ ...signUp, username: e.target.value })}
                  autoComplete="username"
                />
                <div className="relative">
                  <FormField
                    id="signup-password"
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={signUp.password}
                    error={signUpErrors.password}
                    onChange={(e) => setSignUp({ ...signUp, password: e.target.value })}
                    autoComplete="new-password"
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
                <div className="relative">
                  <FormField
                    id="signup-confirm"
                    label="Confirm Password"
                    type={showConfirm ? 'text' : 'password'}
                    value={signUp.confirmPassword}
                    error={signUpErrors.confirmPassword}
                    onChange={(e) => setSignUp({ ...signUp, confirmPassword: e.target.value })}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-[34px] text-[var(--color-muted)]"
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  >
                    {showConfirm ? <EyeSlash size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <Button type="submit" disabled={submitting}>
                  {submitting && <CircleNotch size={16} className="animate-spin" />}
                  Create Account
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
