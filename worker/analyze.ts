import { spawn, spawnSync } from "node:child_process";
import { mkdtemp, writeFile, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Prisma } from "@prisma/client";
import { PIPELINE_VERSION } from "../lib/constants";
import { enqueueJob } from "../lib/jobs";
import { prisma } from "../lib/prisma";
import { downloadMedia, uploadMedia } from "../lib/storage";

function runPython(script: string, args: string[]) {
  return new Promise<string>((resolve, reject) => {
    const child = spawn("python3", [script, ...args], { stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    let err = "";
    child.stdout.on("data", (chunk) => {
      out += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      err += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve(out.trim());
      else reject(new Error(err || `analyze.py exited ${code}`));
    });
  });
}

export async function runAnalyze(submissionId: string) {
  const started = Date.now();
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { student: true, media: true },
  });
  if (!submission) throw new Error("submission not found");
  if (!submission.student.approvedAt) {
    throw new Error("student not approved — refusing analyze");
  }

  const dir = await mkdtemp(join(tmpdir(), "analyze-"));
  const videoPath = join(dir, "take.bin");
  try {
    const bytes = await downloadMedia(submission.media.storagePath);
    await writeFile(videoPath, bytes);

    let metrics: Prisma.InputJsonValue = { skipped: true };
    try {
      const raw = await runPython(join(process.cwd(), "scripts/analyze.py"), [videoPath]);
      metrics = JSON.parse(raw) as Prisma.InputJsonValue;
    } catch (error) {
      metrics = {
        skipped: true,
        error: error instanceof Error ? error.message : "analyze failed",
      };
    }

    const durationS =
      typeof (metrics as { duration_s?: number }).duration_s === "number"
        ? (metrics as { duration_s: number }).duration_s
        : submission.media.durationS;

    await prisma.media.update({
      where: { id: submission.mediaId },
      data: { durationS: durationS ?? undefined, sizeBytes: bytes.length },
    });

    const audioPath = `derived/${submission.id}/audio.wav`;
    try {
      const wavOut = join(dir, "audio.wav");
      spawnSync(
        "ffmpeg",
        ["-y", "-i", videoPath, "-vn", "-ac", "1", "-ar", "22050", wavOut],
        { stdio: "ignore" },
      );
      const wav = await readFile(wavOut);
      await uploadMedia(audioPath, wav, "audio/wav");
    } catch {
      // derivative is best-effort
    }

    await prisma.analysis.create({
      data: {
        submissionId,
        pipelineVersion: PIPELINE_VERSION,
        metricsJson: metrics,
        costCents: 0,
        latencyMs: Date.now() - started,
      },
    });

    await enqueueJob("draft", { submissionId }, submissionId);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
