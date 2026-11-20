export function serviceWaitElapsedMs(startedAt: Date | string, now = Date.now()) {
  const start = startedAt instanceof Date ? startedAt.getTime() : Date.parse(startedAt);
  if (!Number.isFinite(start)) return 0;
  return Math.max(0, now - start);
}

export function serviceWaitTimedOut(startedAt: Date | string, ms: number, now = Date.now()) {
  return serviceWaitElapsedMs(startedAt, now) >= ms;
}

export function remainingServiceWaitMs(startedAt: number, ms: number, now = Date.now()) {
  return Math.max(0, startedAt + ms - now);
}

export async function withServiceWait<T>(work: Promise<T>, label: string, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function fetchWithServiceWait(input: RequestInfo | URL, init: RequestInit, ms: number) {
  if (init.signal) return fetch(input, init);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
