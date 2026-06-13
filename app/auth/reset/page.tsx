import ResetClient from "./resetclient";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token = "" } = await searchParams;
  return <ResetClient token={token} />;
}
