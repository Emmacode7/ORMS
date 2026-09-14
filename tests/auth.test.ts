import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth";

describe("password hashing", () => {
  it("never stores the plaintext password", async () => {
    const hash = await hashPassword("Correct-Horse-Battery-1");
    expect(hash).not.toBe("Correct-Horse-Battery-1");
    expect(hash.length).toBeGreaterThan(20);
  });

  it("verifies a correct password", async () => {
    const hash = await hashPassword("my-secure-password");
    await expect(verifyPassword("my-secure-password", hash)).resolves.toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("my-secure-password");
    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });

  it("produces a different hash for the same password each time (unique salt)", async () => {
    const hashA = await hashPassword("same-input");
    const hashB = await hashPassword("same-input");
    expect(hashA).not.toBe(hashB);
  });
});
