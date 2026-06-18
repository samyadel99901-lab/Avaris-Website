import Image from "next/image";
import { Suspense } from "react";
import { LoginForm } from "@/components/admin/login/LoginForm";

export const metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-6 text-ink">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-2">
          <Image
            src="/logo.png"
            alt="AVARIS"
            width={32}
            height={32}
            className="h-8 w-8 object-contain"
          />
          <div>
            <div className="font-wordmark text-sm uppercase tracking-[0.3em] text-ink">
              AVARIS
            </div>
            <div className="font-body text-[10px] uppercase tracking-[0.2em] text-ink-faint">
              Admin
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 shadow-xl shadow-black/40 backdrop-blur-sm">
          <h1 className="mb-1 font-body text-lg font-semibold text-ink">
            Sign in
          </h1>
          <p className="mb-6 font-body text-sm text-ink-muted">
            Use the credentials Samy set up.
          </p>
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
