import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6">
      <h1 className="font-display text-3xl">Không tìm thấy</h1>
      <Link href="/" className="mt-4 text-beat">
        Về trang chủ
      </Link>
    </main>
  );
}
