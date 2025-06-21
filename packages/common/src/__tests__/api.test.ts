import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateEmailAlias, ApiError } from '../api';
import { loadSettings } from '../storage';
import { generateAlias as coreGenerateAlias } from 'email-alias-core';

// Mock the dependencies of api.ts to isolate the module for testing
vi.mock('../storage', () => ({
  loadSettings: vi.fn(),
}));
vi.mock('email-alias-core', () => ({
  generateAlias: vi.fn(),
}));

describe('API Module: generateEmailAlias', () => {
  const validSettings = {
    domain: 'example.com',
    token: 'super-secret-token',
  };

  beforeEach(() => {
    // Reset mocks before each test to ensure test isolation
    vi.clearAllMocks();
  });

  it('should call the core library with the correct parameters when input is valid', async () => {
    // Arrange
    const aliasParts = ['shopping', 'amazon'];
    vi.mocked(loadSettings).mockResolvedValue(validSettings);
    vi.mocked(coreGenerateAlias).mockResolvedValue('test-alias@example.com');

    // Act
    await generateEmailAlias(aliasParts);

    // Assert
    expect(coreGenerateAlias).toHaveBeenCalledOnce();
    expect(coreGenerateAlias).toHaveBeenCalledWith({
      aliasParts,
      domain: validSettings.domain,
      secretKey: validSettings.token,
    });
  });

  describe('Input Validation Errors', () => {
    const expectedError =
      'Invalid input: exactly two parts (Label and Source) are required.';

    it('should throw an ApiError if aliasParts array is empty', async () => {
      await expect(generateEmailAlias([])).rejects.toThrow(expectedError);
    });

    it('should throw an ApiError if aliasParts array has only one element', async () => {
      await expect(generateEmailAlias(['shopping'])).rejects.toThrow(
        expectedError
      );
    });

    it('should throw an ApiError if aliasParts array has more than two elements', async () => {
      await expect(generateEmailAlias(['a', 'b', 'c'])).rejects.toThrow(
        expectedError
      );
    });

    it('should throw an ApiError if any part in the array is an empty string', async () => {
      await expect(generateEmailAlias(['shopping', ''])).rejects.toThrow(
        'Both Label and Source fields are required.'
      );
    });

    it('should throw an ApiError if any part in the array is just whitespace', async () => {
      await expect(generateEmailAlias(['   ', 'amazon'])).rejects.toThrow(
        'Both Label and Source fields are required.'
      );
    });
  });

  describe('Configuration Validation Errors', () => {
    it('should throw an ApiError if settings are not configured', async () => {
      // Arrange
      vi.mocked(loadSettings).mockResolvedValue({});

      // Act & Assert
      await expect(generateEmailAlias(['test', 'case'])).rejects.toThrow(
        /Domain and Token are not configured/
      );
    });
  });

  describe('Core Library Error Handling', () => {
    it('should catch errors from email-alias-core and re-throw as an ApiError', async () => {
      // Arrange
      vi.mocked(loadSettings).mockResolvedValue(validSettings);
      const coreError = new Error('Invalid character in token');
      vi.mocked(coreGenerateAlias).mockRejectedValue(coreError);

      // Act & Assert
      await expect(generateEmailAlias(['test', 'case'])).rejects.toThrow(
        `Failed to generate alias: ${coreError.message}`
      );
    });
  });
});
