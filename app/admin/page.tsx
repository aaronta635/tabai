import { StudioTitle } from "@/components/home/feed";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { teacherMetrics } from "@/lib/metrics-data";
import { createTeacher, deleteStudent } from "@/app/admin/actions";
import { DemoSongs } from "@/components/admin/demo-songs";
import { DEMO_TEACHER_NAME } from "@/lib/demo-teacher";
import { getLocale, getMessages } from "@/lib/i18n";
import { appOrigin } from "@/lib/origin";

export default async function AdminHome() {
  const ok = await requireAdmin();
  const locale = await getLocale();
  const t = await getMessages(locale);

  if (!ok) {
    return (
      <form action="/api/admin/login" method="post" className="studio-panel mx-auto max-w-md space-y-3">
        <h1 className="font-display">{t.admin.login}</h1>
        <label className="block">
          <span className="field-label">{t.admin.secret}</span>
          <input type="password" name="secret" className="field mt-1.5" autoComplete="current-password" />
        </label>
        <button className="btn" type="submit">
          {t.admin.login}
        </button>
      </form>
    );
  }

  const [teachers, demoSongs] = await Promise.all([
    prisma.teacher.findMany({ where: { name: { not: DEMO_TEACHER_NAME } }, orderBy: { createdAt: "asc" } }),
    prisma.piece.findMany({
      where: { demo: true, archived: false },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        code: true,
        models: { where: { status: "ready" }, take: 1, select: { id: true } },
      },
    }),
  ]);
  const origin = await appOrigin();
  const rows = await Promise.all(
    teachers.map(async (teacher) => ({
      teacher,
      metrics: await teacherMetrics(teacher.id),
    })),
  );

  return (
    <div className="space-y-6">
      <StudioTitle
        title={t.admin.teachers}
        action={
          <a href="/api/admin/deck" className="btn btn-quiet">
            {t.admin.deck}
          </a>
        }
      />

      <DemoSongs
        labels={{
          title: t.admin.demoTitle,
          help: t.admin.demoHelp,
          name: t.admin.demoName,
          sheet: t.admin.demoSheet,
          video: t.admin.demoVideo,
          save: t.admin.demoSave,
          replace: t.admin.demoReplace,
          ready: t.admin.demoReady,
          training: t.admin.demoTraining,
          needSheet: t.admin.demoNeedSheet,
          tooBig: t.admin.demoTooBig,
          failed: t.admin.demoFailed,
        }}
        songs={demoSongs.map((song) => ({
          id: song.id,
          title: song.title,
          code: song.code,
          ready: song.models.length > 0,
        }))}
      />

      <form action={createTeacher} className="studio-panel flex flex-wrap items-end gap-2">
        <label className="min-w-0 flex-1">
          <span className="field-label">{t.admin.createTeacher}</span>
          <input name="name" className="field mt-1.5" />
        </label>
        <button className="btn" type="submit">
          {t.admin.createTeacher}
        </button>
      </form>

      <ul className="space-y-4">
        {rows.map(({ teacher, metrics }) => (
          <li key={teacher.id} className="studio-panel">
            <p className="font-display text-xl">{teacher.name}</p>
            <p className="page-meta break-all">
              {t.admin.invite}: {origin}/t/{teacher.inviteToken}
            </p>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-ink-soft">{t.admin.timePerReply}</dt>
                <dd>{formatMs(metrics.medianTimePerReplyMs)}</dd>
              </div>
              <div>
                <dt className="text-ink-soft">manual / draft</dt>
                <dd>
                  {formatMs(metrics.medianManualMs)} / {formatMs(metrics.medianDraftedMs)}
                </dd>
              </div>
              <div>
                <dt className="text-ink-soft">{t.admin.untouched}</dt>
                <dd>{Math.round(metrics.approveUntouchedRate * 100)}%</dd>
              </div>
              <div>
                <dt className="text-ink-soft">{t.admin.cost}</dt>
                <dd>{metrics.costPerSubmissionCents.toFixed(1)}¢</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>

      <form action={deleteStudent} className="studio-panel student-destructive-zone space-y-3">
        <h2 className="font-display">{t.admin.deleteStudent}</h2>
        <label className="block">
          <span className="field-label">{t.admin.deleteStudent}</span>
          <input name="studentId" className="field mt-1.5" />
        </label>
        <button type="submit" className="btn">
          {t.admin.deleteStudent}
        </button>
      </form>
    </div>
  );
}

function formatMs(ms: number | null) {
  if (ms == null) return "—";
  return `${Math.round(ms / 1000)}s`;
}
