import { describe, expect, it } from "vitest";
import { CLOUD_WORKER_URL, cloudWorkerUrl, workerAuthorization } from "@/lib/cloud-worker";

describe("cloudWorkerUrl", () => {
  it("points local dev at the Cloud Run worker", () => {
    expect(cloudWorkerUrl({ NODE_ENV: "development" })).toBe(CLOUD_WORKER_URL);
  });

  it("lets WORKER_URL override the default and ignores a trailing slash", () => {
    expect(cloudWorkerUrl({ NODE_ENV: "development", WORKER_URL: "https://worker.example/" })).toBe(
      "https://worker.example",
    );
  });

  it("stays quiet in production, in tests, and inside the worker process", () => {
    expect(cloudWorkerUrl({ NODE_ENV: "production" })).toBeNull();
    expect(cloudWorkerUrl({ NODE_ENV: "development", VITEST: "true" })).toBeNull();
    expect(cloudWorkerUrl({ NODE_ENV: "development", WORKER_LOOP: "1" })).toBeNull();
  });

  it("sends the shared token when one is set", () => {
    expect(workerAuthorization({})).toEqual({});
    expect(workerAuthorization({ WORKER_TOKEN: "secret" })).toEqual({ authorization: "Bearer secret" });
  });
});
