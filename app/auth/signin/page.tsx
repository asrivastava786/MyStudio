import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import SignInClient from "./SignInClient";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const session = await auth();

  if (session?.user) {
    const safeCb = callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : "/designer/dashboard";
    redirect(safeCb);
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <SignInClient />
    </div>
  );
}
