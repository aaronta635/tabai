import { redirect } from "next/navigation";

export default async function LegacyClassJoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  redirect(`/join/${code.toLowerCase()}`);
}
