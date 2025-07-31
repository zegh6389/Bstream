import { describe, expect, test, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createTestUser } from "./utils/mock-setup";
import { logAuditEvent, AuditAction } from "../src/lib/audit";
import { getServerSession } from "next-auth";

vi.mock("next-auth");

const prisma = new PrismaClient();

describe("Audit Logging", () => {
  let userId: string;

  beforeEach(async () => {
    await prisma.auditLog.deleteMany();
    await prisma.user.deleteMany();
    const user = await createTestUser(prisma);
    userId = user.id;
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: userId } } as any);
  });

  afterAll(async () => {
    await prisma.auditLog.deleteMany();
    await prisma.user.deleteMany();
  });

  test.skip("logs audit event", async () => {
    const event = await logAuditEvent(
      prisma,
      AuditAction.CREATE,
      "user",
      userId
    );
    expect(event.action).toBe(AuditAction.CREATE);
    expect(event.resource).toBe("user");
    expect(event.resourceId).toBe(userId);
  });

  test.skip("retrieves audit logs with filters", async () => {
    await logAuditEvent(prisma, AuditAction.CREATE, "user", userId);
    await logAuditEvent(prisma, AuditAction.UPDATE, "user", userId);

    const logs = await prisma.auditLog.findMany({
      where: { action: AuditAction.CREATE },
    });
    expect(logs.length).toBe(1);
    expect(logs[0].action).toBe(AuditAction.CREATE);
  });

  test.skip("includes detailed metadata", async () => {
    const details = { field: "name", oldValue: "old", newValue: "new" };
    const metadata = { ip: "127.0.0.1", userAgent: "test-agent" };
    const event = await logAuditEvent(
      prisma,
      AuditAction.UPDATE,
      "user",
      userId,
      details,
      metadata
    );
    expect(event.details).toEqual(details);
    expect(event.ip).toBe(metadata.ip);
    expect(event.userAgent).toBe(metadata.userAgent);
  });

  test.skip("enforces required fields", async () => {
    // @ts-ignore
    await expect(logAuditEvent(prisma, null, "user")).rejects.toThrow();
  });
});
