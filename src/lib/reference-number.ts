import type { Prisma } from "@prisma/client";

/**
 * Atomically generate the next reference number for the given year, in the
 * form ORMS-2026-000001. Must be called inside a Prisma transaction so the
 * increment is race-free under concurrent submissions.
 */
export async function nextReferenceNumber(
  tx: Prisma.TransactionClient,
  year: number = new Date().getFullYear()
): Promise<string> {
  const counterId = `request-${year}`;

  const counter = await tx.counter.upsert({
    where: { id: counterId },
    update: { value: { increment: 1 } },
    create: { id: counterId, value: 1 },
  });

  const padded = String(counter.value).padStart(6, "0");
  return `ORMS-${year}-${padded}`;
}
