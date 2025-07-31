import { vi } from 'vitest';
import '@testing-library/jest-dom';
import './utils/mock-prisma';

process.env.DATABASE_URL = 'file:./test.db';

vi.mock('../src/lib/redis', () => ({
  redis: {},
}));



vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: () => ({ get: vi.fn(), set: vi.fn(), delete: vi.fn() }),
  headers: () => ({ get: vi.fn() }),
}));

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn(),
  PutObjectCommand: vi.fn(),
  GetObjectCommand: vi.fn(),
  ListObjectsCommand: vi.fn(),
  DeleteObjectCommand: vi.fn(),
}));
