import { spawn, spawnSync } from "node:child_process";
import { join } from "node:path";
import { FFMPEG_WAIT_MS, PITCH_OVERLAY_VERSION, PITCH_PYTHON_WAIT_MS } from "../lib/constants";
import type { HeardPitchNote } from "../lib/pitch-overlay";

export function pitchEnabled() {
  return process.env.BASIC_PITCH === "1";
}

export function pitchPython() {
  const override = process.env.BASIC_PITCH_PYTHON?.trim();
  if (override) return override;
  for (const bin of ["python3.11", "python3.12", "python3.10"]) {
    const probe = spawnSync(bin, ["-c", "pass"], { stdio: "ignore" });
    if (probe.status === 0) return bin;
  }
  return "python3";
}

export function parsePitchStdout(raw: string) {
  const lines = raw
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("{"));
  const json = lines[lines.length - 1] ?? raw.trim();
  return JSON.parse(json) as { notes?: HeardPitchNote[]; error?: string };
}

export function runPython(script: string, args: string[], binary: string, ms: number) {
  return new Promise<string>((resolve, reject) => {
    const child = spawn(binary, [script, ...args], { stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    let err = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`${script} timed out after ${ms}ms`));
    }, ms);
    child.stdout.on("data", (chunk) => {
      out += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      err += chunk.toString();
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve(out.trim());
      else reject(new Error(err || `${script} exited ${code}`));
    });
  });
}

export async function extractPitchFromWav(wavPath: string) {
  const raw = await runPython(
    join(process.cwd(), "scripts/basic_pitch_notes.py"),
    [wavPath],
    pitchPython(),
    PITCH_PYTHON_WAIT_MS,
  );
  const parsed = parsePitchStdout(raw);
  const notes = Array.isArray(parsed.notes) ? parsed.notes : [];
  return {
    notes,
    error: parsed.error,
    pitch_overlay_version: parsed.error ? undefined : PITCH_OVERLAY_VERSION,
  };
}

export function writeVideoWav(videoPath: string, wavPath: string) {
  spawnSync(
    "ffmpeg",
    ["-y", "-i", videoPath, "-vn", "-ac", "1", "-ar", "22050", wavPath],
    { stdio: "ignore", timeout: FFMPEG_WAIT_MS },
  );
}

export async function extractPitchFromVideo(videoPath: string, wavPath: string) {
  writeVideoWav(videoPath, wavPath);
  return extractPitchFromWav(wavPath);
}
