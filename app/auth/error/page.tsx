import Link from "next/link";

const messages: Record<string, string> = {
  Configuration: "Server configuration error. Please contact support.",
  AccessDenied: "You do not have permission to sign in.",
  Verification: "The sign-in link has expired or already been used.",
  CredentialsSignin: "Invalid email/username or password.",
  OAuthAccountNotLinked: "This email is already linked to another sign-in method.",
  Default: "An error occurred during sign in.",
};

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const message = messages[error ?? "Default"] ?? messages.Default;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <main className="flex-1 grid place-items-center px-6 py-16">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-black/60 backdrop-blur p-8 text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 grid place-items-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-red-400">
              <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-semibold">Sign-in error</h1>
            <p className="text-sm text-white/60 mt-2">{message}</p>
          </div>
          <Link
            href="/auth/signin"
            className="inline-block px-5 py-2.5 rounded-2xl border border-white/20 hover:border-white/40 text-sm transition-colors"
          >
            Back to sign in
          </Link>
        </div>
      </main>
    </div>
  );
}
