import { describe, expect, test, beforeAll, afterAll, beforeEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import { S3Client } from "@aws-sdk/client-s3";
import { mockS3Client, clearDatabase, createTestUser, createTestAttachment } from "./utils/mock-setup";
import { createUploadUrl, finalizeUpload, getDownloadUrl, deleteAttachment } from "../src/lib/attachments";

const prisma = new PrismaClient();

describe("Attachment System", () => {
  let userId: string;
  let attachmentId: string;

  beforeEach(async () => {
    await clearDatabase(prisma);
    const user = await createTestUser(prisma);
    userId = user.id;
  });

  afterAll(async () => {
    await clearDatabase(prisma);
  });

  test.skip("generates upload URL", async () => {
    const result = await createUploadUrl(prisma, {
      contentType: "image/jpeg",
      fileName: "test.jpg",
    });
    expect(result.success).toBe(true);
    expect(result.uploadUrl).toBeDefined();
    expect(result.key).toBeDefined();
  });

  test.skip("finalizes upload", async () => {
    const attachment = await createTestAttachment(prisma, userId);
    attachmentId = attachment.id;

    const result = await finalizeUpload(prisma, {
      attachmentId,
      fileSize: 1024,
      checksum: "checksum",
    });
    expect(result.success).toBe(true);
    expect(result.attachment?.status).toBe("UPLOADED");
  });

  test.skip("generates download URL", async () => {
    const attachment = await createTestAttachment(prisma, userId);
    attachmentId = attachment.id;
    await prisma.attachment.update({ where: { id: attachmentId }, data: { status: "UPLOADED" } });

    const result = await getDownloadUrl(prisma, attachmentId);
    expect(result.success).toBe(true);
    expect(result.url).toBeDefined();
  });

  test.skip("deletes attachment", async () => {
    const attachment = await createTestAttachment(prisma, userId);
    attachmentId = attachment.id;
    await prisma.attachment.update({ where: { id: attachmentId }, data: { status: "UPLOADED" } });

    const result = await deleteAttachment(prisma, attachmentId, userId);
    expect(result.success).toBe(true);
  });

  test.skip("enforces file type restrictions", async () => {
    const result = await createUploadUrl(prisma, {
      contentType: "application/x-msdownload" as any,
      fileName: "test.exe",
    });
    expect(result.success).toBe(false);
    expect(result.error).toBe("Unsupported file type");
  });

  test.skip("enforces file size limits", async () => {
    const attachment = await createTestAttachment(prisma, userId);
    attachmentId = attachment.id;

    const result = await finalizeUpload(prisma, {
      attachmentId,
      fileSize: 100 * 1024 * 1024, // 100MB
      checksum: "checksum",
    });
    expect(result.success).toBe(false);
    expect(result.error).toBe("File size exceeds limit");
  });
});
