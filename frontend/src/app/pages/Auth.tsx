import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { useAuth } from "@/app/providers/AuthProvider";

type AuthMode = "login" | "register";

interface FormState {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const INITIAL_FORM: FormState = {
  displayName: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export function AuthPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<AuthMode>("login");
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [singpassMessage, setSingpassMessage] = useState<string | null>(null);

  const redirectTo = new URLSearchParams(location.search).get("redirect") || "/";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSingpassMessage(null);

    const email = form.email.trim();
    const password = form.password;
    const displayName = form.displayName.trim();

    if (mode === "register") {
      if (!displayName) {
        setError("Display name is required.");
        return;
      }

      if (password.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }

      if (password !== form.confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (mode === "login") {
        await login({ email, password });
      } else {
        await register({ displayName, email, password });
      }
      navigate(redirectTo, { replace: true });
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to continue. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSingpassStart() {
    setError(null);
    setSingpassMessage("To be implemented");
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-accent-primary text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.12),transparent_32%),linear-gradient(180deg,rgba(10,24,44,0.10),rgba(10,24,44,0.26))]" />
      <div className="absolute left-[-8%] top-[-6%] h-56 w-56 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-8%] h-64 w-64 rounded-full bg-white/10 blur-3xl" />

      <main className="relative mx-auto flex min-h-screen w-full max-w-md flex-col justify-between px-6 py-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/10 px-3 py-1 text-[12px] font-semibold tracking-[0.18em] text-white/90 backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-white" />
            COMPLAINSG
          </div>

          <div className="mt-8">
            <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-white/70">
              Safety Reporting
            </p>
            <h1 className="mt-3 text-[38px] font-bold leading-[1.02]">
              {mode === "login" ? "Sign in to continue" : "Create your account"}
            </h1>
            <p className="mt-3 max-w-[30ch] text-[15px] leading-6 text-white/76">
              Use email and password to access incident reporting, trusted updates, and your profile.
            </p>
          </div>
        </div>

        <section className="mt-8 rounded-[32px] bg-white px-5 pb-6 pt-5 text-text-primary shadow-[0_24px_70px_rgba(10,24,44,0.24)]">
          <button
            type="button"
            onClick={handleSingpassStart}
            className="inline-flex w-full items-center justify-center gap-3 rounded-full border border-border-subtle bg-surface-2 px-4 py-3.5 text-[15px] font-bold text-text-primary transition-colors hover:bg-surface-1"
          >
            <span className="material-symbols-outlined text-[20px] text-accent-primary">verified_user</span>
            Verify with Singpass
          </button>

          <div className="my-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-text-disabled">
            <span className="h-px flex-1 bg-border-subtle" />
            or use email
            <span className="h-px flex-1 bg-border-subtle" />
          </div>

          {singpassMessage ? (
            <div className="mb-5 rounded-2xl border border-border-subtle bg-surface-2 px-4 py-3 text-sm text-text-secondary">
              {singpassMessage}
            </div>
          ) : null}

          <div className="flex rounded-full bg-surface-2 p-1">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ${
                mode === "login" ? "bg-accent-primary text-white shadow-primary-btn" : "text-text-secondary"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`flex-1 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ${
                mode === "register" ? "bg-accent-primary text-white shadow-primary-btn" : "text-text-secondary"
              }`}
            >
              Create Account
            </button>
          </div>

          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            {mode === "register" ? (
              <Field
                label="Display name"
                type="text"
                autoComplete="name"
                value={form.displayName}
                onChange={(value) => updateField("displayName", value)}
                placeholder="Your name"
              />
            ) : null}

            <Field
              label="Email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(value) => updateField("email", value)}
              placeholder="you@example.com"
            />

            <Field
              label="Password"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={form.password}
              onChange={(value) => updateField("password", value)}
              placeholder="At least 8 characters"
            />

            {mode === "register" ? (
              <Field
                label="Confirm password"
                type="password"
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={(value) => updateField("confirmPassword", value)}
                placeholder="Re-enter your password"
              />
            ) : null}

            {error ? (
              <div className="rounded-2xl border border-danger/20 bg-danger/8 px-4 py-3 text-sm text-danger">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center rounded-full bg-accent-primary px-4 py-3.5 text-[15px] font-bold text-white shadow-primary-btn transition-transform disabled:cursor-not-allowed disabled:opacity-70 active:scale-[0.98]"
            >
              {isSubmitting ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

        </section>
      </main>
    </div>
  );
}

interface FieldProps {
  label: string;
  type: string;
  autoComplete?: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}

function Field({ label, type, autoComplete, value, placeholder, onChange }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-text-primary">{label}</span>
      <input
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-2xl border border-border-subtle bg-surface-1 px-4 text-sm text-text-primary outline-none transition-colors placeholder:text-text-disabled focus:border-accent-primary"
      />
    </label>
  );
}
