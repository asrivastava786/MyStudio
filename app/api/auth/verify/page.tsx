
//export const runtime = "edge"; //issue with cloudflare pages
export default function Verify() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md border rounded-xl p-6 space-y-2 text-center">
        <h1 className="text-xl font-semibold">Sprawdź skrzynkę</h1>
        <p>We've sent you a login link. Please check your inbox (and spam).</p>
      </div>
    </main>
  );
}
