import { claimNextJob, failJob, finishJob } from "../lib/jobs";
import { runAnalyze } from "./analyze";
import { runDraft } from "./draft";

const POLL_MS = 2000;

async function handle(job: { id: string; type: string; payload: unknown }) {
  const payload = job.payload as { submissionId?: string };
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
        await failJob(job.id, message);
      }
    } catch (error) {
      console.error("worker loop", error);
      await new Promise((r) => setTimeout(r, POLL_MS));
    }
  }
}

void loop();
