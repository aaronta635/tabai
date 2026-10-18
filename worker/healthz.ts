import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

export function healthzPayload() {
  return { ok: true as const, role: "worker" as const };
}

export function healthzStatus(method: string | undefined, url: string | undefined) {
  const path = (url ?? "/").split("?")[0];
  if (method === "GET" && (path === "/healthz" || path === "/api/health")) return 200;
  return 404;
}

export function handleHealthz(req: IncomingMessage, res: ServerResponse) {
  const status = healthzStatus(req.method, req.url);
  if (status === 200) {
    const body = JSON.stringify(healthzPayload());
    res.writeHead(200, { "content-type": "application/json", "content-length": Buffer.byteLength(body) });
    res.end(body);
    return;
  }
  res.writeHead(404);
  res.end();
}

/** Cloud Run requires a process listening on $PORT. Poll loop stays in the same process. */
export function listenHealthz() {
  const port = Number(process.env.PORT || 8080);
  const server = createServer(handleHealthz);
  server.listen(port, () => {
    console.log("worker healthz", port);
  });
  return server;
}
