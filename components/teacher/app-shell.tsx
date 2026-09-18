"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logoutTeacher } from "@/app/teacher/actions";
import { BrandMark } from "@/components/landing/brand-mark";
import { LocaleToggle } from "@/components/locale-toggle";
import { Strings } from "@/components/strings";

type Labels = {
  dashboard: string;
  invite: string;
  queue: string;
  settings: string;
  signOut: string;
  menu: string;
  close: string;
};

export function TeacherAppShell({
  teacherName,
  locale,
  labels,
  children,
}: {
  teacherName: string;
  locale: string;
  labels: Labels;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [queueBadge, setQueueBadge] = useState(0);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    void fetch("/api/session", { method: "POST" });
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/teacher/counts")
      .then((res) => res.json() as Promise<{ unanswered?: number; pending?: number }>)
      .then((data) => {
        if (cancelled) return;
        setQueueBadge((data.unanswered ?? 0) + (data.pending ?? 0));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const items = [
    { href: "/teacher", label: labels.dashboard, exact: true },
    { href: "/teacher/pieces", label: labels.invite, exact: false },
    { href: "/teacher/queue", label: labels.queue, exact: false, badge: queueBadge },
    { href: "/teacher/settings", label: labels.settings, exact: false },
  ];

  function active(href: string, exact: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`) || pathname.startsWith(`${href}?`);
  }

  const nav = (
    <nav className="flex flex-1 flex-col gap-1">
      {items.map((item) => {
        const on = active(item.href, item.exact);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm ${
              on ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span>{item.label}</span>
            {item.badge ? (
              <span className="rounded-full bg-butter px-2 py-0.5 text-[11px] font-medium text-void">
                {item.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );

  const rail = (
    <div className="flex h-full flex-col">
      <div className="px-4 pt-6 text-white">
        <Link href="/teacher" className="inline-flex" aria-label="howl0">
          <BrandMark light />
        </Link>
        <Strings className="mt-5 text-white/50" />
        <p className="font-display mt-5 text-lg">{teacherName}</p>
      </div>
      <div className="mt-8 flex flex-1 flex-col px-3">{nav}</div>
      <div className="mt-auto space-y-3 px-4 pb-6">
        <LocaleToggle locale={locale} tone="dark" />
        <form action={logoutTeacher}>
          <button type="submit" className="text-sm text-white/55 hover:text-white">
            {labels.signOut}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="teacher-shell lg:flex">
      <aside className="teacher-rail hidden w-64 shrink-0 lg:block">{rail}</aside>

      <header className="teacher-rail flex items-center justify-between px-4 py-3 text-white lg:hidden">
        <Link href="/teacher" aria-label="howl0">
          <BrandMark light compact />
        </Link>
        <button
          type="button"
          className="rounded-full border border-white/20 px-3 py-1.5 text-sm"
          onClick={() => setOpen(true)}
        >
          {labels.menu}
        </button>
      </header>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label={labels.close}
            onClick={() => setOpen(false)}
          />
          <aside className="teacher-rail relative h-full w-72 max-w-[85vw] shadow-2xl">
            <div className="flex justify-end px-3 pt-3">
              <button
                type="button"
                className="rounded-full px-3 py-1 text-sm text-white/70"
                onClick={() => setOpen(false)}
              >
                {labels.close}
              </button>
            </div>
            {rail}
          </aside>
        </div>
      ) : null}

      <div className="min-w-0 flex-1">
        <div className="mx-auto max-w-3xl px-4 py-8 lg:px-8">{children}</div>
      </div>
    </div>
  );
}
