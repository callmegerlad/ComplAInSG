import { useState } from "react";
import { Link } from "react-router";

type AuthMode = "signin" | "signup";

export function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("signin");

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
              {mode === "signin" ? "Sign in to continue" : "Create your account"}
            </h1>
            <p className="mt-3 max-w-[28ch] text-[15px] leading-6 text-white/76">
              {mode === "signin"
                ? "Access nearby incidents, upload reports, and coordinate with responders."
                : "Join the network to report incidents quickly and receive live updates nearby."}
            </p>
          </div>
        </div>

        <section className="mt-8 rounded-[32px] bg-white px-5 pb-6 pt-5 text-text-primary shadow-[0_24px_70px_rgba(10,24,44,0.24)]">
          <div className="grid grid-cols-2 rounded-full bg-accent-subtle p-1">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`rounded-full px-4 py-2.5 text-[14px] font-semibold transition-colors ${
                mode === "signin" ? "bg-accent-primary text-white shadow-primary-btn" : "text-text-secondary"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`rounded-full px-4 py-2.5 text-[14px] font-semibold transition-colors ${
                mode === "signup" ? "bg-accent-primary text-white shadow-primary-btn" : "text-text-secondary"
              }`}
            >
              Create Account
            </button>
          </div>

          <form className="mt-5 space-y-4">
            {mode === "signup" ? (
              <Field label="Full Name" type="text" placeholder="Your full name" icon="person" />
            ) : null}
            <Field label="Email" type="email" placeholder="name@email.com" icon="mail" />
            <Field label="Password" type="password" placeholder="Enter your password" icon="lock" />
            {mode === "signup" ? (
              <Field
                label="Confirm Password"
                type="password"
                placeholder="Re-enter your password"
                icon="verified_user"
              />
            ) : null}

            {mode === "signup" ? (
              <label className="flex items-start gap-3 rounded-2xl bg-surface-2 px-4 py-3 text-[13px] leading-5 text-text-secondary">
                <input
                  type="checkbox"
                  defaultChecked
                  className="mt-0.5 h-4 w-4 rounded border-border-subtle text-accent-primary focus:ring-accent-primary"
                />
                <span>
                  I agree to receive urgent incident alerts and accept the app&apos;s terms and privacy policy.
                </span>
              </label>
            ) : (
              <div className="flex items-center justify-between px-1 text-[13px]">
                <label className="flex items-center gap-2 text-text-secondary">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-border-subtle text-accent-primary focus:ring-accent-primary"
                  />
                  Remember me
                </label>
                <button type="button" className="font-semibold text-accent-primary">
                  Forgot password?
                </button>
              </div>
            )}

            <Link
              to="/"
              className="inline-flex w-full items-center justify-center rounded-full bg-accent-primary px-4 py-3.5 text-[15px] font-bold text-white shadow-primary-btn transition-transform active:scale-[0.98]"
            >
              {mode === "signin" ? "Sign In" : "Create Account"}
            </Link>
          </form>

          <div className="mt-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border-subtle" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-disabled">
              or continue with
            </span>
            <div className="h-px flex-1 bg-border-subtle" />
          </div>

          <div className="mt-4">
            <button
              type="button"
              className="w-full rounded-2xl border border-border-subtle bg-surface-1 px-4 py-3 text-[14px] font-semibold text-text-primary transition-colors hover:bg-surface-2"
            >
              Singpass
            </button>
          </div>

          <p className="mt-5 text-center text-[13px] text-text-secondary">
            {mode === "signin" ? "New here?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="font-semibold text-accent-primary"
            >
              {mode === "signin" ? "Create one" : "Sign in instead"}
            </button>
          </p>
        </section>
      </main>
    </div>
  );
}

function Field({
  label,
  type,
  placeholder,
  icon,
}: {
  label: string;
  type: string;
  placeholder: string;
  icon: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.14em] text-text-secondary">
        {label}
      </span>
      <div className="flex items-center gap-3 rounded-2xl border border-border-subtle bg-surface-1 px-4 py-3">
        <span className="material-symbols-outlined text-[18px] text-accent-primary">{icon}</span>
        <input
          type={type}
          placeholder={placeholder}
          className="w-full bg-transparent text-[14px] text-text-primary placeholder:text-text-disabled focus:outline-none"
        />
      </div>
    </label>
  );
}
