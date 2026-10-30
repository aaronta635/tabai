export const MEDIA_URL_MAX_IDS = 24;
export const MEDIA_URL_LIMIT = 80;
export const MEDIA_URL_WINDOW_MS = 15_000;

const buckets = new Map<string, number[]>();

export function mediaIdsFromSearch(params: URLSearchParams): { ids: string[]; overflow: boolean } {
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const raw of params.getAll("mediaId")) {
    const id = raw.trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    if (ids.length === MEDIA_URL_MAX_IDS) return { ids, overflow: true };
    ids.push(id);
  }
  return { ids, overflow: false };
}

export function allowMediaUrlLookups(teacherId: string, count: number, now = Date.now()) {
  const windowStart = now - MEDIA_URL_WINDOW_MS;
  const recent = (buckets.get(teacherId) ?? []).filter((at) => at > windowStart);
  if (count < 1 || recent.length + count > MEDIA_URL_LIMIT) {
    buckets.set(teacherId, recent);
    return false;
  }
  for (let i = 0; i < count; i += 1) recent.push(now);
  buckets.set(teacherId, recent);
  return true;
}

export function resetMediaUrlLookups() {
  buckets.clear();
}
