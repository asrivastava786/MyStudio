import { getSessionServer } from "@/lib/auth";
import Link from "next/link";

export const runtime = "edge"; //issue with cloudflare pages

export default async function DesignerHome() {
  const session = await getSessionServer();
  if (!session?.user) {
    return <div className="p-6">Brak dostępu.</div>;
  }
  // Optional: strict role check
  // if (session.user.role !== "DESIGNER" && session.user.role !== "ADMIN") return <div>Brak dostępu.</div>;

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Panel Projektanta</h1>
      <p>Witaj, {session.user.email}</p>
      <ul className="list-disc ml-6">
        <li><Link href="/designer/upload">Prześlij projekt</Link></li>
        <li><Link href="/designer/submissions">Twoje zgłoszenia</Link></li>
      </ul>
    </main>
  );
}
