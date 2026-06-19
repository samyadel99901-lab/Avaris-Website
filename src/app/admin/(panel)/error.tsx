"use client";

import { AlertTriangle, RefreshCcw } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/admin/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/admin/ui/Card";

/**
 * Error boundary for every page under the admin (panel) group.
 *
 * Admin pages read live from Supabase; if Supabase is unreachable (project
 * paused/deleted, wrong URL, no network) a server component throws and React
 * would otherwise blow up the whole route. This catches it, keeps the
 * AdminShell (sidebar) intact, and shows an actionable message instead.
 */
export default function AdminPanelError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin] page error:", error);
  }, [error]);

  const msg = error.message ?? "";
  const supabaseDown =
    /fetch failed/i.test(msg) ||
    /ENOTFOUND|EAI_AGAIN|getaddrinfo|could not resolve/i.test(msg) ||
    /supabase/i.test(msg);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-2xl uppercase tracking-wide text-ink">
          Something went wrong
        </h1>
        <p className="mt-1 font-body text-sm text-ink-muted">
          This page couldn&apos;t load its data.
        </p>
      </header>

      <Card>
        <CardHeader
          title={supabaseDown ? "Data source unreachable" : "Unexpected error"}
          description={
            supabaseDown
              ? "Couldn't reach Supabase"
              : "An error occurred while rendering this page"
          }
          actions={
            <Button variant="primary" size="sm" onClick={reset}>
              <RefreshCcw size={14} strokeWidth={1.75} />
              Try again
            </Button>
          }
        />
        <CardBody className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle
              size={18}
              className="mt-0.5 shrink-0 text-amber-400"
            />
            <div className="font-body text-sm text-ink-muted">
              {supabaseDown ? (
                <>
                  <p className="text-ink">
                    The dashboard can&apos;t connect to its Supabase database.
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    <li>
                      Check the Supabase project is{" "}
                      <span className="text-ink">active (not paused)</span> at
                      dashboard.supabase.com.
                    </li>
                    <li>
                      Confirm <code className="text-ink">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
                      in <code className="text-ink">.env.local</code> matches the
                      project.
                    </li>
                    <li>
                      If the project was deleted, create a new one and run the{" "}
                      <code className="text-ink">supabase/migrations</code>.
                    </li>
                  </ul>
                </>
              ) : (
                <p>
                  Try again, or check the server logs for details. Switching{" "}
                  <code className="text-ink">ADMIN_DATA_SOURCE=mock</code> falls
                  back to sample data.
                </p>
              )}
            </div>
          </div>

          <pre className="overflow-x-auto rounded-md border border-white/10 bg-black/30 px-3 py-2 font-mono text-xs text-ink-faint">
            {msg || "Unknown error"}
          </pre>
        </CardBody>
      </Card>
    </div>
  );
}
