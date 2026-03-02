import { useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router";
import { getSingpassCallbackUrl } from "@/lib/auth";

export function SingpassCallbackPage() {
  const location = useLocation();
  const callbackUrl = getSingpassCallbackUrl();

  const targetUrl = useMemo(() => {
    if (!callbackUrl) {
      return null;
    }

    const separator = callbackUrl.includes("?") ? "&" : "?";
    const query = location.search.startsWith("?") ? location.search.slice(1) : location.search;
    return query ? `${callbackUrl}${separator}${query}` : callbackUrl;
  }, [callbackUrl, location.search]);

  useEffect(() => {
    if (!targetUrl) {
      return;
    }

    window.location.replace(targetUrl);
  }, [targetUrl]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary px-6">
      <div className="w-full max-w-md rounded-[28px] bg-surface-1 p-6 text-center shadow-card">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-subtle text-accent-primary">
          <span className="material-symbols-outlined text-[28px]">verified_user</span>
        </div>

        <h1 className="mt-4 text-xl font-bold text-text-primary">Processing Singpass verification</h1>

        {targetUrl ? (
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            Redirecting you to complete the secure verification step.
          </p>
        ) : (
          <>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              The frontend callback bridge is not configured yet.
            </p>
            <p className="mt-3 text-sm leading-6 text-text-secondary">
              Set <code>VITE_SINGPASS_CALLBACK_URL</code> to your backend callback endpoint, then retry.
            </p>
            <Link
              to="/auth"
              className="mt-5 inline-flex items-center justify-center rounded-full bg-accent-primary px-4 py-2.5 text-sm font-semibold text-white"
            >
              Back to sign in
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
