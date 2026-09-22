import { isPrismaConnectionError } from "../lib/db-errors";
import { loadLocalEnv } from "../lib/load-env";
import { claimNextJob, failJob, finishJob } from "../lib/jobs";
import { reconnectPrisma } from "../lib/prisma";
import type { PieceModelSourceJson } from "../lib/score-model";
import { runAnalyze } from "./analyze";
import { runDraft } from "./draft";
import { runTrainPiece } from "./train";

loadLocalEnv();

const POLL_MS = 2000;
const RECONNECT_WAIT_MS = 5000;

async function handle(job: { id: string; type: string; payload: unknown }) {
  const payload = job.payload as {
    submissionId?: string;
    pieceId?: string;
  } & Partial<PieceModelSourceJson>;

  if (job.type === "train_piece") {
    if (!payload.pieceId) throw new Error("job missing pieceId");
    const extras = { ...payload };
    delete extras.pieceId;
    delete extras.submissionId;
    await runTrainPiece(payload.pieceId, extras);
    return;
  }

  const submissionId = payload.submissionId;
  if (!submissionId) throw new Error("job missing submissionId");

  if (job.type === "analyze") {
    await runAnalyze(submissionId);
    return;
  }
  if (job.type === "draft") {
    await runDraft(submissionId);
    return;
  }
  if (job.type === "perceive_audio" || job.type === "perceive_video") {
    throw new Error(`${job.type} is gated — not enabled in v1`);
  }
  throw new Error(`unknown job type ${job.type}`);
}

async function loop() {
  console.log("worker listening");
  for (;;) {
    try {
      const job = await claimNextJob();
      if (!job) {
        await new Promise((r) => setTimeout(r, POLL_MS));
        continue;
      }
      try {
        await handle(job);
        await finishJob(job.id);
        console.log("job done", job.type, job.id);
      } catch (error) {
        const message = error instanceof Error ? error.message : "unknown";
        console.error("job failed", job.id, message);
        if (isPrismaConnectionError(error)) {
          await reconnectPrisma();
        }
        await failJob(job.id, message);
      }
    } catch (error) {
      console.error("worker loop", error);
      if (isPrismaConnectionError(error)) {
        try {
          await reconnectPrisma();
          console.log("prisma reconnected");
        } catch (reconnectError) {
          console.error("prisma reconnect failed", reconnectError);
        }
        await new Promise((r) => setTimeout(r, RECONNECT_WAIT_MS));
        continue;
      }
      await new Promise((r) => setTimeout(r, POLL_MS));
    }
  }
}

void loop();
