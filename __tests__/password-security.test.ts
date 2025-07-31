import { describe, expect, test } from 'vitest';
import { hashPassword, verifyPassword, validatePassword } from '../src/lib/auth/password';

describe('Password Security', () => {
  test('should hash password correctly', async () => {
    const password = 'SecureP@ssw0rd123';
    const result = await hashPassword(password);

    expect(result.hash).toBeDefined();
    expect(result.salt).toBeDefined();
    expect(result.hash).toHaveLength(128); // 64 bytes hex encoded
    expect(result.salt).toHaveLength(32); // 16 bytes hex encoded
  });

  test('should verify password correctly', async () => {
    const password = 'SecureP@ssw0rd123';
    const { hash, salt } = await hashPassword(password);

    const isValid = await verifyPassword(password, hash, salt);
    expect(isValid).toBe(true);

    const isInvalid = await verifyPassword('WrongPassword123!', hash, salt);
    expect(isInvalid).toBe(false);
  });

  test('should validate password requirements', () => {
    // Test valid password
    const validResult = validatePassword('SecureP@ssw0rd123');
    expect(validResult.isValid).toBe(true);
    expect(validResult.errors).toHaveLength(0);

    // Test short password
    const shortResult = validatePassword('Short1!');
    expect(shortResult.isValid).toBe(false);
    expect(shortResult.errors).toContain('Password must be at least 12 characters long');

    // Test missing uppercase
    const noUpperResult = validatePassword('nouppercase123!');
    expect(noUpperResult.isValid).toBe(false);
    expect(noUpperResult.errors).toContain('Password must contain at least one uppercase letter');

    // Test missing lowercase
    const noLowerResult = validatePassword('NOLOWERCASE123!');
    expect(noLowerResult.isValid).toBe(false);
    expect(noLowerResult.errors).toContain('Password must contain at least one lowercase letter');

    // Test missing number
    const noNumberResult = validatePassword('NoNumberHere!');
    expect(noNumberResult.isValid).toBe(false);
    expect(noNumberResult.errors).toContain('Password must contain at least one number');

    // Test missing special character
    const noSpecialResult = validatePassword('NoSpecialChar123');
    expect(noSpecialResult.isValid).toBe(false);
    expect(noSpecialResult.errors).toContain('Password must contain at least one special character');
  });

  test('should produce different hashes for same password with different salts', async () => {
    const password = 'SecureP@ssw0rd123';
    const result1 = await hashPassword(password);
    const result2 = await hashPassword(password);

    expect(result1.hash).not.toBe(result2.hash);
    expect(result1.salt).not.toBe(result2.salt);
  });
});
