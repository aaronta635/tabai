import { describe, expect, it } from "vitest";
import { healthzPayload, healthzStatus } from "./healthz";

describe("worker healthz", () => {
  it("accepts Cloud Run probes", () => {
    expect(healthzStatus("GET", "/healthz")).toBe(200);
    expect(healthzStatus("GET", "/api/health")).toBe(200);
    expect(healthzPayload()).toEqual({ ok: true, role: "worker" });
  });

  it("rejects other paths", () => {
    expect(healthzStatus("GET", "/jobs")).toBe(404);
    expect(healthzStatus("POST", "/healthz")).toBe(404);
  });
});
