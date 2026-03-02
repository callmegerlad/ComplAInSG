import { useNavigate } from "react-router";
import { useAuth } from "@/app/providers/AuthProvider";

export function AuthPage() {
  const { demoLogin } = useAuth();
  const navigate = useNavigate();

  const handleSingpass = () => {
    demoLogin();
    navigate("/", { replace: true });
  };
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
            <h1 className="mt-3 text-[38px] font-bold leading-[1.02]">Sign in to continue</h1>
            <p className="mt-3 max-w-[28ch] text-[15px] leading-6 text-white/76">
              Access nearby incidents, upload reports, and coordinate with responders.
            </p>
          </div>
        </div>

        <section className="mt-8 rounded-[32px] bg-white px-5 pb-6 pt-5 text-text-primary shadow-[0_24px_70px_rgba(10,24,44,0.24)]">
          <div className="mt-5 rounded-[28px] bg-surface-2 px-5 py-5">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent-primary text-white shadow-primary-btn">
                <span className="material-symbols-outlined text-[24px]">verified_user</span>
              </div>
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-accent-primary">
                  Singpass Login
                </p>
                <h2 className="mt-1 text-[20px] font-bold text-text-primary">Continue with Singpass</h2>
                <p className="mt-2 text-[14px] leading-6 text-text-secondary">
                  Use your existing Singpass identity to access reports, nearby incidents, and responder updates.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-border-subtle bg-surface-1 px-4 py-3">
                <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-text-secondary">
                  What you&apos;ll get
                </p>
                <ul className="mt-2 space-y-2 text-[14px] leading-6 text-text-primary">
                  <li>Verified identity for safer incident reporting</li>
                  <li>Faster response coordination and trusted updates</li>
                  <li>No separate app password to remember</li>
                </ul>
              </div>

              <button
                type="button"
                onClick={handleSingpass}
                className="inline-flex w-full items-center justify-center rounded-full bg-accent-primary px-4 py-3.5 text-[15px] font-bold text-white shadow-primary-btn transition-transform active:scale-[0.98]"
              >
                Continue with Singpass
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
