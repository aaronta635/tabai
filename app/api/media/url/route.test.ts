import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MEDIA_URL_MAX_IDS } from "@/lib/media-url-guard";

const auth = vi.hoisted(() => ({
  readTeacherSession: vi.fn(),
  requireTeacher: vi.fn(),
}));

const db = vi.hoisted(() => ({
  findMany: vi.fn(),
}));

const media = vi.hoisted(() => ({
  signedMediaUrl: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  readTeacherSession: auth.readTeacherSession,
  requireTeacher: auth.requireTeacher,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { media: { findMany: db.findMany } },
}));

vi.mock("@/lib/media-view", () => ({
  signedMediaUrl: media.signedMediaUrl,
}));

import { GET } from "@/app/api/media/url/route";
import { resetMediaUrlLookups } from "@/lib/media-url-guard";

function request(ids: string[]) {
  const params = new URLSearchParams();
  for (const id of ids) params.append("mediaId", id);
  return new NextRequest(`https://app.paramuzic.com/api/media/url?${params.toString()}`);
}

describe("GET /api/media/url", () => {
  beforeEach(() => {
    resetMediaUrlLookups();
    auth.readTeacherSession.mockReset();
    auth.requireTeacher.mockReset();
    db.findMany.mockReset();
    media.signedMediaUrl.mockReset();
    auth.readTeacherSession.mockResolvedValue({ id: "teacher-1", name: "Ada" });
    media.signedMediaUrl.mockImplementation(async (path: string) => `https://cdn.example/${path}`);
  });

  it("rejects a caller with no teacher session", async () => {
    auth.readTeacherSession.mockResolvedValue(null);
    auth.requireTeacher.mockResolvedValue(null);

    const response = await GET(request(["media-1"]));

    expect(response.status).toBe(401);
    expect(db.findMany).not.toHaveBeenCalled();
  });

  it("loads every requested file in one query", async () => {
    db.findMany.mockResolvedValue([
      { id: "media-1", storagePath: "a.webm" },
      { id: "media-2", storagePath: "b.webm" },
    ]);

    const response = await GET(request(["media-1", "media-2"]));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      urls: {
        "media-1": "https://cdn.example/a.webm",
        "media-2": "https://cdn.example/b.webm",
      },
    });
    expect(db.findMany).toHaveBeenCalledTimes(1);
    expect(auth.requireTeacher).not.toHaveBeenCalled();
    expect(db.findMany.mock.calls[0]?.[0].where).toMatchObject({
      id: { in: ["media-1", "media-2"] },
      submissions: { some: { piece: { teacherId: "teacher-1" } } },
    });
  });

  it("keeps a single id on the old response", async () => {
    db.findMany.mockResolvedValue([{ id: "media-1", storagePath: "a.webm" }]);

    const response = await GET(request(["media-1"]));

    expect(await response.json()).toEqual({ url: "https://cdn.example/a.webm" });
  });

  it("does not query when the list is longer than one page", async () => {
    const ids = Array.from({ length: MEDIA_URL_MAX_IDS + 1 }, (_, i) => `media-${i}`);

    const response = await GET(request(ids));

    expect(response.status).toBe(400);
    expect(db.findMany).not.toHaveBeenCalled();
  });

  it("stops answering once this teacher has asked enough", async () => {
    db.findMany.mockResolvedValue([]);
    const burst = Array.from({ length: 4 }, () => GET(request(Array.from({ length: 20 }, (_, i) => `media-${i}`))));
    await Promise.all(burst);

    const response = await GET(request(["media-1"]));

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("15");
    expect(db.findMany).toHaveBeenCalledTimes(4);
  });
});
