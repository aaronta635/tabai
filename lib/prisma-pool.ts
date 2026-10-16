const DEFAULT_CONNECTION_LIMIT = 6;
const MAX_CONNECTION_LIMIT = 10;

/** Session pooler (5432) caps clients. A home render sends several queries at once; 3 slots made the rest wait out the pool timeout. */
export function prismaConnectionLimit(raw = process.env.PRISMA_CONNECTION_LIMIT) {
  const n = raw != null && raw.trim() !== "" ? Number(raw) : DEFAULT_CONNECTION_LIMIT;
  if (!Number.isFinite(n) || n < 1) return DEFAULT_CONNECTION_LIMIT;
  return Math.min(Math.floor(n), MAX_CONNECTION_LIMIT);
}

export function withPrismaPoolParams(url: string, limit = prismaConnectionLimit()) {
  const extra: string[] = [];
  if (!/[?&]connection_limit=/.test(url)) extra.push(`connection_limit=${limit}`);
  if (!/[?&]pool_timeout=/.test(url)) extra.push("pool_timeout=10");
  // A Tokyo handshake is about 2.5s. The 5s default, and a 20s wait, both stall the page.
  if (!/[?&]connect_timeout=/.test(url)) extra.push("connect_timeout=8");
  if (extra.length === 0) return url;
  return `${url}${url.includes("?") ? "&" : "?"}${extra.join("&")}`;
}

/**
 * App + worker must use the transaction pooler (6543). Session mode (5432) allows
 * 15 clients for the whole project — Next + worker fill that immediately.
 */
export function runtimeDatasourceUrl(
  databaseUrl = process.env.DATABASE_URL,
  directUrl = process.env.DIRECT_URL,
) {
  const raw = databaseUrl?.trim() || directUrl?.trim();
  if (!raw) return undefined;
  let url = raw;
  if (/:6543\b/.test(url) && !/[?&]pgbouncer=/.test(url)) {
    url += `${url.includes("?") ? "&" : "?"}pgbouncer=true`;
  }
  return withPrismaPoolParams(url);
}
