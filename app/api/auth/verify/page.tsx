import Link from "next/link";

export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <main className="flex-1 grid place-items-center px-6 py-16">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-black/60 backdrop-blur p-8 text-center space-y-4">
          {/* Icon */}
          <div className="mx-auto w-14 h-14 rounded-2xl bg-white/8 border border-white/10 grid place-items-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-white/70">
              <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <div>
            <h1 className="text-2xl font-semibold">Check your inbox</h1>
            <p className="text-sm text-white/60 mt-2 leading-relaxed">
              We sent you a sign-in link. Click it to log in — it expires in&nbsp;1&nbsp;hour.
            </p>
            <p className="text-xs text-white/35 mt-2">Can't find it? Check your spam folder.</p>
          </div>

          <Link
            href="/auth/signin"
            className="inline-block mt-2 px-5 py-2.5 rounded-2xl border border-white/20 hover:border-white/40 text-sm transition-colors"
          >
            Back to sign in
          </Link>
        </div>
      </main>
    </div>
  );
}
