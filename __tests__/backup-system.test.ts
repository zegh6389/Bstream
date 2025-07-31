import { describe, expect, test, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { S3Client } from "@aws-sdk/client-s3";
import { mockS3Client, clearDatabase, createTestUser, testBackupContent } from "./utils/mock-setup";
import { createBackup, restoreBackup, listBackups } from "../src/lib/backup";

const prisma = new PrismaClient();

describe("Backup System", () => {
  let userId: string;

  beforeEach(async () => {
    await clearDatabase(prisma);
    const user = await createTestUser(prisma, true);
    userId = user.id;
    vi.clearAllMocks();
  });

  afterAll(async () => {
    await clearDatabase(prisma);
  });

  test.skip("creates full backup successfully", async () => {
    const backup = await createBackup(prisma, "full");

    expect(backup.success).toBe(true);
    expect(backup.fileName).toBeDefined();
  });

  test.skip("restores backup successfully", async () => {
    const backup = await createBackup(prisma, "full");
    const restore = await restoreBackup(prisma, backup.fileName as string);

    expect(restore.success).toBe(true);
    expect(restore.tablesRestored).toBeDefined();
  });

  test.skip("lists available backups", async () => {
    await createBackup(prisma, "full");
    const backups = await listBackups();

    expect(backups.success).toBe(true);
    expect(backups.backups?.length).toBeGreaterThan(0);
  });

  test.skip("validates backup content before restore", async () => {
    // Create a fake backup file
    const fakeBackup = {
      metadata: { version: "0.0.1" }, // Invalid version
      data: {},
    };
    mockS3Client.send.mockResolvedValueOnce({
      Body: {
        transformToString: vi.fn().mockResolvedValue(JSON.stringify(fakeBackup)),
      },
    });

    const restore = await restoreBackup(prisma, "fake-backup.json.gz");

    expect(restore.success).toBe(false);
    expect(restore.error).toContain("Invalid backup version");
  });
});
