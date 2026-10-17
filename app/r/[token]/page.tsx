import { notFound } from "next/navigation";
import { getLocale, getMessages } from "@/lib/i18n";
import { milestoneText } from "@/lib/report";
import { loadWeeklyReport } from "@/lib/weekly-report";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return {
    title: "howl0",
    robots: { index: false, follow: false },
  };
}

export default async function ParentReportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const locale = await getLocale();
  const t = await getMessages(locale);
  const report = await loadWeeklyReport(token, locale);
  if (!report) notFound();

  const rows = [
    { label: t.report.week, value: report.week },
    { label: t.report.song, value: report.song ?? t.report.noSong },
    { label: t.report.takes, value: String(report.takes) },
    { label: t.report.streak, value: t.report.streakDays.replace("{n}", String(report.streak)) },
  ];

  return (
    <main className="studio-shell">
      <div className="mx-auto max-w-lg space-y-6 px-5 py-10">
        <header>
          <p className="page-meta">{report.teacherName}</p>
          <h1 className="font-display text-3xl">{report.studentName}</h1>
          {report.milestone ? <p className="mt-2 text-ink-soft">{milestoneText(report.milestone, t.report)}</p> : null}
        </header>

        <section className="studio-panel">
          <table className="studio-table">
            <tbody>
              {rows.map((row) => (
                <tr key={row.label}>
                  <td>{row.label}</td>
                  <td className="text-right font-semibold">{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="studio-panel">
          <h2>{t.report.letter}</h2>
          {report.letter ? (
            <p className="mt-3 whitespace-pre-wrap leading-relaxed">{report.letter}</p>
          ) : (
            <p className="mt-3 text-ink-soft">{t.report.noLetter}</p>
          )}
        </section>

        {report.paymentUrl ? (
          <a className="btn" href={report.paymentUrl} target="_blank" rel="noopener noreferrer">
            {t.report.pay}
          </a>
        ) : null}
      </div>
    </main>
  );
}
