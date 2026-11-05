/** Live Cloud Run worker. Local dev asks it to run the job instead of `npm run worker`. */
export const CLOUD_WORKER_URL = "https://para-music-f4pduxs6ea-as.a.run.app";

const RUN_BUDGET_MS = 14 * 60 * 1000;

type Env = Record<string, string | undefined>;

export function cloudWorkerUrl(env: Env = process.env) {
  if (env.WORKER_LOOP === "1") return null;
  const configured = env.WORKER_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  if (env.NODE_ENV === "development" && !env.VITEST) return CLOUD_WORKER_URL;
  return null;
}

export function workerAuthorization(env: Env = process.env): Record<string, string> {
  const token = env.WORKER_TOKEN?.trim();
  return token ? { authorization: `Bearer ${token}` } : {};
}

/** Holds the Cloud Run request open so that service keeps CPU while it claims the queued job. */
export function wakeCloudWorker() {
  const base = cloudWorkerUrl();
  if (!base) return;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), RUN_BUDGET_MS);
  console.log("cloud worker run");
  void fetch(`${base}/api/jobs/run`, {
    method: "POST",
    headers: workerAuthorization(),
    signal: controller.signal,
  })
    .then((response) => {
      if (!response.ok) console.error("cloud worker run", response.status);
      else console.log("cloud worker run done");
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : "cloud worker failed";
      if (message.includes("abort")) return;
      console.error("cloud worker run", message);
    })
    .finally(() => clearTimeout(timer));
}
