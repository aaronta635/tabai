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
      <form action="/api/admin/login" method="post" className="space-y-3 rounded-2xl bg-night-card p-4">
        <h1 className="font-display text-2xl">{t.admin.login}</h1>
        <input
          type="password"
          name="secret"
          placeholder={t.admin.secret}
          className="w-full rounded-xl bg-night px-3 py-3"
        />
        <button className="rounded-xl bg-forest px-4 py-3 text-white" type="submit">
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">{t.admin.teachers}</h1>
        <a href="/api/admin/deck" className="rounded-full border border-bone/20 px-3 py-1 text-sm">
          {t.admin.deck}
        </a>
      </div>

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

      <form action={createTeacher} className="flex gap-2 rounded-2xl bg-night-card p-4">
        <input name="name" placeholder="Tên thầy" className="flex-1 rounded-xl bg-night px-3 py-3" />
        <button className="rounded-xl bg-forest px-4 py-3 text-white" type="submit">
          {t.admin.createTeacher}
        </button>
      </form>

      <ul className="space-y-4">
        {rows.map(({ teacher, metrics }) => (
          <li key={teacher.id} className="rounded-2xl bg-night-card p-4">
            <p className="font-display text-xl">{teacher.name}</p>
            <p className="mt-1 break-all text-xs text-bone/50">
              {t.admin.invite}: {origin}/t/{teacher.inviteToken}
            </p>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-bone/50">{t.admin.timePerReply}</dt>
                <dd>{formatMs(metrics.medianTimePerReplyMs)}</dd>
              </div>
              <div>
                <dt className="text-bone/50">manual / draft</dt>
                <dd>
                  {formatMs(metrics.medianManualMs)} / {formatMs(metrics.medianDraftedMs)}
                </dd>
              </div>
              <div>
                <dt className="text-bone/50">{t.admin.untouched}</dt>
                <dd>{Math.round(metrics.approveUntouchedRate * 100)}%</dd>
              </div>
              <div>
                <dt className="text-bone/50">{t.admin.cost}</dt>
                <dd>{metrics.costPerSubmissionCents.toFixed(1)}¢</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>

      <form action={deleteStudent} className="space-y-2 rounded-2xl bg-night-card p-4">
        <h2 className="font-display text-xl">{t.admin.deleteStudent}</h2>
        <input name="studentId" placeholder="student id" className="w-full rounded-xl bg-night px-3 py-3" />
        <button type="submit" className="rounded-xl bg-danger px-4 py-3 text-white">
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
