import { notFound } from "next/navigation";
import { ReportStories } from "@/components/report/report-stories";
import { getLocale, getMessages } from "@/lib/i18n";
import { reportStories } from "@/lib/report";
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

  const stories = reportStories(
    {
      practices: report.practices,
      takes: report.takes,
      highlightStart: report.highlightStart,
      progress: report.progressNote,
      keyPoint: report.keyPoint,
      nextStep: report.nextStep,
    },
    t.report,
  );

  return (
    <main className="report-frame">
      <ReportStories
        studentName={report.studentName}
        teacherName={report.teacherName}
        token={token}
        stories={stories}
        highlightFallback={t.report.noHighlight}
        previousLabel={t.report.previous}
        nextLabel={t.report.next}
        pay={report.paymentUrl ? { href: report.paymentUrl, label: t.report.pay } : null}
      />
    </main>
  );
}
