import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

export function healthzPayload() {
  return { ok: true as const, role: "worker" as const };
}

export function requestPath(url: string | undefined) {
  return (url ?? "/").split("?")[0];
}

export function isJobRunRequest(method: string | undefined, url: string | undefined) {
  return method === "POST" && requestPath(url) === "/api/jobs/run";
}

export function healthzStatus(method: string | undefined, url: string | undefined) {
  const path = requestPath(url);
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

/** Cloud Run requires a process listening on $PORT. A job run keeps the request open so CPU stays allocated. */
export function listenHealthz(onRun?: (req: IncomingMessage, res: ServerResponse) => void) {
  const port = Number(process.env.PORT || 8080);
  const server = createServer((req, res) => {
    if (onRun && isJobRunRequest(req.method, req.url)) {
      onRun(req, res);
      return;
    }
    handleHealthz(req, res);
  });
  server.listen(port, () => {
    console.log("worker healthz", port);
  });
  return server;
}
