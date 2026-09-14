import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { getRequestForViewing } from "@/lib/requests";
import { generateRequestPdf } from "@/lib/pdf";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const request = await getRequestForViewing(user, id);

  if (!request) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const pdfBuffer = await generateRequestPdf(request);

  return new NextResponse(pdfBuffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${request.referenceNumber}.pdf"`,
    },
  });
}
