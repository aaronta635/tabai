export function editDistance(a: string, b: string) {
  const s = a.trim();
  const t = b.trim();
  const n = s.length;
  const m = t.length;
  if (n === 0) return m;
  if (m === 0) return n;

  const prev = new Array<number>(m + 1);
  const curr = new Array<number>(m + 1);
  for (let j = 0; j <= m; j++) prev[j] = j;

  for (let i = 1; i <= n; i++) {
    curr[0] = i;
    for (let j = 1; j <= m; j++) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= m; j++) prev[j] = curr[j];
  }
  return prev[m];
}

export function classifyReplySource(draftText: string | null, sentText: string) {
  if (!draftText) return { source: "manual" as const, editDistance: null };
  const distance = editDistance(draftText, sentText);
  if (distance === 0) return { source: "approved_draft" as const, editDistance: 0 };
  return { source: "edited_draft" as const, editDistance: distance };
}
