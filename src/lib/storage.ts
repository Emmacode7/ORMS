import "server-only";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

// Local-disk storage adapter for the prototype. Swap this module for an
// S3-compatible client later — callers only depend on saveFile/resolvePath,
// so nothing outside this file needs to change.

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "./uploads";

function safeExtension(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  // Only allow a short, simple extension; strip anything unexpected.
  return /^\.[a-z0-9]{1,5}$/.test(ext) ? ext : "";
}

export async function saveFile(
  buffer: Buffer,
  originalName: string
): Promise<{ storedName: string; size: number }> {
  const dir = path.resolve(UPLOAD_DIR);
  await mkdir(dir, { recursive: true });

  const storedName = `${randomUUID()}${safeExtension(originalName)}`;
  const filePath = path.join(dir, storedName);

  await writeFile(filePath, buffer);

  return { storedName, size: buffer.length };
}

export function resolveFilePath(storedName: string): string {
  // storedName is always a server-generated UUID + short extension, so this
  // is safe from path traversal, but we defensively strip separators anyway.
  const safe = path.basename(storedName);
  return path.resolve(UPLOAD_DIR, safe);
}
