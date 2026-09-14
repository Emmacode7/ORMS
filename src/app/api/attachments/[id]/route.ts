import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { canViewRequest } from "@/lib/authorization";
import { resolveFilePath } from "@/lib/storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const attachment = await prisma.attachment.findUnique({
    where: { id },
    include: { request: true },
  });

  // Return an identical 404 whether the attachment doesn't exist or the
  // user simply isn't allowed to see it, so a guessed/incremented id can't
  // be used to probe for the existence of other requests' files.
  if (!attachment || !canViewRequest(user, attachment.request)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const filePath = resolveFilePath(attachment.storedName);
    const data = await readFile(filePath);
    return new NextResponse(data as unknown as BodyInit, {
      headers: {
        "Content-Type": attachment.mimeType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(
          attachment.fileName
        )}"`,
        "Content-Length": String(attachment.size),
      },
    });
  } catch {
    return NextResponse.json({ error: "File unavailable" }, { status: 404 });
  }
}
