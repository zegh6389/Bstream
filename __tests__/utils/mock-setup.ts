import { PrismaClient } from "@prisma/client";
import { createHash } from "crypto";
import { S3Client } from "@aws-sdk/client-s3";
import Redis from "ioredis-mock";
import { vi } from "vitest";

// Mock S3 Client
export const mockS3Client = {
  send: vi.fn().mockResolvedValue({
    Body: {
      transformToString: vi.fn().mockResolvedValue(JSON.stringify({
        metadata: { version: "1.0.0" },
        data: {}
      })),
      transformToByteArray: vi.fn().mockResolvedValue(Buffer.from("test")),
    },
    Contents: [
      {
        Key: "test-backup.json",
        LastModified: new Date(),
        Size: 1000,
      }
    ]
  }),
};

// Mock Redis for rate limiting
export const mockRedis = new Redis();

// Clean database between tests
export const clearDatabase = async (prisma: PrismaClient) => {
  const tables = [
    'attachment',
    'auditLog',
    'transaction',
    'category',
    'business',
    'verificationToken',
    'resetToken',
    'session',
    'account',
    'user',
  ];

  for (const table of tables) {
    // @ts-ignore - Dynamic table access
    await prisma[table].deleteMany();
  }
};

// Create test user
export const createTestUser = async (prisma: PrismaClient, isAdmin = false) => {
  return prisma.user.create({
    data: {
      email: "test@example.com",
      name: "Test User",
      password: createHash('sha256').update("password123").digest('hex'),
      isAdmin,
    },
  });
};

// Create test attachment
export const createTestAttachment = async (prisma: PrismaClient, userId: string) => {
  return prisma.attachment.create({
    data: {
      key: "test-attachment.pdf",
      fileName: "test.pdf",
      contentType: "application/pdf",
      status: "active",
      userId,
    },
  });
};

// Create test business
export const createTestBusiness = async (prisma: PrismaClient, userId: string) => {
  return prisma.business.create({
    data: {
      name: "Test Business",
      userId,
    },
  });
};

// Create test category
export const createTestCategory = async (prisma: PrismaClient) => {
  return prisma.category.create({
    data: {
      name: "Test Category",
      type: "EXPENSE",
    },
  });
};

// Create test transaction
export const createTestTransaction = async (
  prisma: PrismaClient,
  userId: string,
  businessId: string,
  categoryId: string
) => {
  return prisma.transaction.create({
    data: {
      amount: 100,
      type: "EXPENSE",
      userId,
      businessId,
      categoryId,
    },
  });
};

// Test utilities for file contents
export const testBackupContent = {
  metadata: {
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    type: "full",
    format: "json",
    tables: ["user", "transaction"],
    isArchived: false,
  },
  data: {
    user: [{
      id: "test-user",
      email: "test@example.com",
    }],
    transaction: [{
      id: "test-transaction",
      amount: 100,
    }],
  },
};

// Mock AWS credentials for testing
process.env.AWS_REGION = "ca-central-1";
process.env.AWS_ACCESS_KEY_ID = "test";
process.env.AWS_SECRET_ACCESS_KEY = "test";
