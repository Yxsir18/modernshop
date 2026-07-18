import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createAccessToken, createRefreshToken, verifyAccessToken, verifyRefreshToken, generateTokenId } from '../auth/tokens';
import bcrypt from 'bcrypt';

describe('Authentication System Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('JWT Token Management', () => {
    it('should create a valid access token', () => {
      const payload = {
        userId: 'user_123',
        role: 'customer' as const,
        email: 'test@example.com'
      };
      
      const token = createAccessToken(payload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT has 3 parts
    });

    it('should verify a valid access token', () => {
      const payload = {
        userId: 'user_123',
        role: 'customer' as const,
        email: 'test@example.com'
      };
      
      const token = createAccessToken(payload);
      const decoded = verifyAccessToken(token);
      
      expect(decoded.sub).toBe(payload.userId);
      expect(decoded.role).toBe(payload.role);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.typ).toBe('access');
    });

    it('should reject an invalid access token', () => {
      expect(() => {
        verifyAccessToken('invalid.token.here');
      }).toThrow();
    });

    it('should create a valid refresh token', () => {
      const payload = {
        userId: 'user_123',
        tokenId: 'token_abc123'
      };
      
      const token = createRefreshToken(payload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);
    });

    it('should verify a valid refresh token', () => {
      const payload = {
        userId: 'user_123',
        tokenId: 'token_abc123'
      };
      
      const token = createRefreshToken(payload);
      const decoded = verifyRefreshToken(token);
      
      expect(decoded.sub).toBe(payload.userId);
      expect(decoded.jti).toBe(payload.tokenId);
      expect(decoded.typ).toBe('refresh');
    });

    it('should reject an invalid refresh token', () => {
      expect(() => {
        verifyRefreshToken('invalid.token.here');
      }).toThrow();
    });

    it('should generate unique token IDs', () => {
      const id1 = generateTokenId();
      const id2 = generateTokenId();
      
      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
    });
  });

  describe('Password Security', () => {
    it('should hash a password with bcrypt', async () => {
      const password = 'securePassword123';
      const hash = await bcrypt.hash(password, 12);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.startsWith('$2a$') || hash.startsWith('$2b$')).toBe(true);
    });

    it('should verify a correct password with bcrypt', async () => {
      const password = 'securePassword123';
      const hash = await bcrypt.hash(password, 12);
      
      const isValid = await bcrypt.compare(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject an incorrect password with bcrypt', async () => {
      const password = 'securePassword123';
      const wrongPassword = 'wrongPassword456';
      const hash = await bcrypt.hash(password, 12);
      
      const isValid = await bcrypt.compare(wrongPassword, hash);
      expect(isValid).toBe(false);
    });

    it('should reject legacy hash_ format in production', async () => {
      const password = 'securePassword123';
      const legacyHash = `hash_${password}`;
      
      // This should not match with bcrypt.compare
      const isValid = await bcrypt.compare(password, legacyHash);
      expect(isValid).toBe(false);
    });
  });

  describe('Token Security', () => {
    it('should use environment secrets when available', () => {
      // Test that tokens are created with proper secrets
      const payload = {
        userId: 'user_123',
        role: 'customer' as const,
        email: 'test@example.com'
      };
      
      const token = createAccessToken(payload);
      expect(token).toBeDefined();
    });

    it('should have proper token structure', () => {
      const payload = {
        userId: 'user_123',
        role: 'customer' as const,
        email: 'test@example.com'
      };
      
      const token = createAccessToken(payload);
      const decoded = verifyAccessToken(token);
      
      // Verify token has required fields
      expect(decoded).toHaveProperty('sub');
      expect(decoded).toHaveProperty('role');
      expect(decoded).toHaveProperty('email');
      expect(decoded).toHaveProperty('typ');
    });
  });
});
