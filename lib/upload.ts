import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export async function saveUpload(file: File) {
  const uploadsDir = path.join(process.cwd(), "uploads");
  await mkdir(uploadsDir, { recursive: true });
  const storedName = `${randomUUID()}-${file.name}`;
  const storagePath = path.join(uploadsDir, storedName);
  const arrayBuffer = await file.arrayBuffer();
  await writeFile(storagePath, Buffer.from(arrayBuffer));

  return {
    storedName,
    storagePath,
    mimeType: file.type || "application/octet-stream",
    sizeBytes: file.size,
    originalName: file.name,
  };
}
