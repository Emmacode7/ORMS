import "server-only";
import PDFDocument from "pdfkit";
import type { Prisma } from "@prisma/client";
import type { requestDetailInclude } from "./requests";
import { formatDate, formatDateTime, humanizeStatus } from "./utils";

export type RequestWithRelations = Prisma.RequestGetPayload<{
  include: typeof requestDetailInclude;
}>;

const NAVY = "#12294B";
const INK = "#101828";
const MUTED = "#5B6572";
const LINE = "#DDE3EA";

export async function generateRequestPdf(
  request: RequestWithRelations
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 56 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    // Header
    doc
      .fillColor(NAVY)
      .font("Helvetica-Bold")
      .fontSize(10)
      .text("OFFICE REQUEST MANAGEMENT SYSTEM", { characterSpacing: 1 });
    doc.moveDown(0.2);
    doc
      .fillColor(INK)
      .font("Helvetica-Bold")
      .fontSize(18)
      .text("Request Application Record");
    doc.moveDown(0.4);
    doc
      .strokeColor(LINE)
      .lineWidth(1)
      .moveTo(doc.x, doc.y)
      .lineTo(doc.x + pageWidth, doc.y)
      .stroke();
    doc.moveDown(0.8);

    // Reference + date
    doc.font("Helvetica-Bold").fontSize(13).fillColor(NAVY);
    doc.text(request.referenceNumber);
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(MUTED)
      .text(`Printed ${formatDateTime(new Date())}`);
    doc.moveDown(1);

    const leftX = doc.page.margins.left;

    const field = (label: string, value: string) => {
      doc.x = leftX;
      doc.font("Helvetica-Bold").fontSize(9).fillColor(MUTED).text(label.toUpperCase(), leftX, doc.y, {
        width: pageWidth,
        characterSpacing: 0.5,
      });
      doc.x = leftX;
      doc.font("Helvetica").fontSize(11).fillColor(INK).text(value || "—", leftX, doc.y, {
        width: pageWidth,
      });
      doc.x = leftX;
      doc.moveDown(0.6);
    };

    const twoCol = (
      leftLabel: string,
      leftValue: string,
      rightLabel: string,
      rightValue: string
    ) => {
      const colWidth = pageWidth / 2 - 10;
      const rightX = leftX + pageWidth / 2 + 10;
      const startY = doc.y;

      doc.font("Helvetica-Bold").fontSize(9).fillColor(MUTED);
      doc.text(leftLabel.toUpperCase(), leftX, startY, { width: colWidth, characterSpacing: 0.5 });
      const afterLeftLabelY = doc.y;
      doc.font("Helvetica").fontSize(11).fillColor(INK);
      doc.text(leftValue || "—", leftX, afterLeftLabelY, { width: colWidth });
      const leftEndY = doc.y;

      doc.font("Helvetica-Bold").fontSize(9).fillColor(MUTED);
      doc.text(rightLabel.toUpperCase(), rightX, startY, { width: colWidth, characterSpacing: 0.5 });
      const afterRightLabelY = doc.y;
      doc.font("Helvetica").fontSize(11).fillColor(INK);
      doc.text(rightValue || "—", rightX, afterRightLabelY, { width: colWidth });
      const rightEndY = doc.y;

      // Explicitly restore the cursor to the left margin — PDFKit leaves
      // doc.x wherever the last explicit-position .text() call left it
      // (here, the right column), which would otherwise bleed into the
      // next row or any flowing text that follows.
      doc.x = leftX;
      doc.y = Math.max(leftEndY, rightEndY);
      doc.moveDown(0.6);
    };

    twoCol("Date Submitted", formatDate(request.createdAt), "Priority", request.priority);
    twoCol("Applicant", request.requester.fullName, "Staff ID", request.requester.staffId);
    twoCol(
      "Requesting Department",
      request.requestingDepartment.name,
      "Receiving Department",
      request.receivingDepartment.name
    );
    twoCol(
      "Current Status",
      humanizeStatus(request.status),
      "Assigned Officer",
      request.assignedOfficer?.fullName ?? "Unassigned"
    );

    doc.moveDown(0.4);
    field("Subject", request.subject);

    doc.x = leftX;
    doc.font("Helvetica-Bold").fontSize(9).fillColor(MUTED).text("REQUEST DETAILS", leftX, doc.y, {
      width: pageWidth,
      characterSpacing: 0.5,
    });
    doc.x = leftX;
    doc
      .font("Helvetica")
      .fontSize(11)
      .fillColor(INK)
      .text(request.details, leftX, doc.y, { width: pageWidth, lineGap: 2 });
    doc.x = leftX;
    doc.moveDown(1);

    // Activity / status history
    doc
      .strokeColor(LINE)
      .lineWidth(1)
      .moveTo(leftX, doc.y)
      .lineTo(leftX + pageWidth, doc.y)
      .stroke();
    doc.moveDown(0.6);
    doc.x = leftX;
    doc.font("Helvetica-Bold").fontSize(12).fillColor(NAVY).text("Activity History", leftX, doc.y);
    doc.x = leftX;
    doc.moveDown(0.4);

    for (const entry of request.statusHistory) {
      doc.x = leftX;
      doc
        .font("Helvetica-Bold")
        .fontSize(9.5)
        .fillColor(INK)
        .text(`${formatDateTime(entry.createdAt)} — ${humanizeStatus(entry.status)}`, leftX, doc.y, {
          width: pageWidth,
          continued: false,
        });
      if (entry.note) {
        doc.x = leftX;
        doc.font("Helvetica").fontSize(9.5).fillColor(MUTED).text(entry.note, leftX, doc.y, {
          width: pageWidth,
        });
      }
      doc.x = leftX;
      doc.moveDown(0.35);
    }

    doc.moveDown(1);
    doc.x = leftX;
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(MUTED)
      .text(
        "This is a system-generated record from the Office Request Management System (ORMS) and is suitable for internal filing.",
        leftX,
        doc.y,
        { width: pageWidth }
      );

    doc.end();
  });
}
