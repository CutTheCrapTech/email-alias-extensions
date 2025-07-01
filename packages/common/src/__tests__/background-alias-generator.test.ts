import { beforeEach, describe, expect, it, vi } from "vitest";
import * as apiModule from "../api";
import {
  ApiError,
  extractDomainForSource,
  generateAliasForBackground,
  generateAliasForBackgroundWithUrl,
  getDefaultLabel,
} from "../background-alias-generator";

// Mock the api module
vi.mock("../api", () => ({
  generateEmailAlias: vi.fn(),
}));

describe("Background Alias Generator", () => {
  const mockGenerateEmailAlias = vi.mocked(apiModule.generateEmailAlias);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("ApiError", () => {
    it("should create an error with the correct name and message", () => {
      const message = "Test error";
      const error = new ApiError(message);

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe("ApiError");
      expect(error.message).toBe(message);
    });

    it("should be identifiable as an ApiError instance", () => {
      const error = new ApiError("Test");
      expect(error instanceof ApiError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });
  });

  describe("getDefaultLabel", () => {
    it("should return the default label 'marketing'", async () => {
      const result = await getDefaultLabel();
      expect(result).toBe("marketing");
    });
  });

  describe("extractDomainForSource", () => {
    it("should return 'website' as the default domain", () => {
      const result = extractDomainForSource();
      expect(result).toBe("website");
    });
  });

  describe("generateAliasForBackground", () => {
    it("should generate an alias using default values", async () => {
      const expectedAlias = "marketing-website@example.com";
      mockGenerateEmailAlias.mockResolvedValue(expectedAlias);

      const result = await generateAliasForBackground();

      expect(result).toBe(expectedAlias);
      expect(mockGenerateEmailAlias).toHaveBeenCalledWith([
        "marketing",
        "website",
      ]);
    });

    it("should throw ApiError when generation fails with Error", async () => {
      const originalError = new Error("Generation failed");
      mockGenerateEmailAlias.mockRejectedValue(originalError);

      await expect(generateAliasForBackground()).rejects.toThrow(ApiError);
      await expect(generateAliasForBackground()).rejects.toThrow(
        "Generation failed",
      );
    });

    it("should throw ApiError with generic message when generation fails with non-Error", async () => {
      mockGenerateEmailAlias.mockRejectedValue("String error");

      await expect(generateAliasForBackground()).rejects.toThrow(ApiError);
      await expect(generateAliasForBackground()).rejects.toThrow(
        "Failed to generate alias",
      );
    });
  });

  describe("generateAliasForBackgroundWithUrl", () => {
    it("should generate an alias using default domain when no URL provided", async () => {
      const expectedAlias = "marketing-website@example.com";
      mockGenerateEmailAlias.mockResolvedValue(expectedAlias);

      const result = await generateAliasForBackgroundWithUrl();

      expect(result).toBe(expectedAlias);
      expect(mockGenerateEmailAlias).toHaveBeenCalledWith([
        "marketing",
        "website",
      ]);
    });

    it("should extract domain from valid URL", async () => {
      const expectedAlias = "marketing-example@example.com";
      mockGenerateEmailAlias.mockResolvedValue(expectedAlias);

      const result = await generateAliasForBackgroundWithUrl(
        "https://www.example.com/path?query=value",
      );

      expect(result).toBe(expectedAlias);
      expect(mockGenerateEmailAlias).toHaveBeenCalledWith([
        "marketing",
        "example.com",
      ]);
    });

    it("should remove www prefix from hostname", async () => {
      const expectedAlias = "marketing-google@example.com";
      mockGenerateEmailAlias.mockResolvedValue(expectedAlias);

      const result = await generateAliasForBackgroundWithUrl(
        "https://www.google.com",
      );

      expect(result).toBe(expectedAlias);
      expect(mockGenerateEmailAlias).toHaveBeenCalledWith([
        "marketing",
        "google.com",
      ]);
    });

    it("should handle non-www hostnames correctly", async () => {
      const expectedAlias = "marketing-github@example.com";
      mockGenerateEmailAlias.mockResolvedValue(expectedAlias);

      const result = await generateAliasForBackgroundWithUrl(
        "https://github.com/user/repo",
      );

      expect(result).toBe(expectedAlias);
      expect(mockGenerateEmailAlias).toHaveBeenCalledWith([
        "marketing",
        "github.com",
      ]);
    });

    it("should fallback to 'website' for invalid URLs", async () => {
      const expectedAlias = "marketing-website@example.com";
      mockGenerateEmailAlias.mockResolvedValue(expectedAlias);

      const result = await generateAliasForBackgroundWithUrl("invalid-url");

      expect(result).toBe(expectedAlias);
      expect(mockGenerateEmailAlias).toHaveBeenCalledWith([
        "marketing",
        "website",
      ]);
    });

    it("should handle localhost URLs", async () => {
      const expectedAlias = "marketing-localhost@example.com";
      mockGenerateEmailAlias.mockResolvedValue(expectedAlias);

      const result = await generateAliasForBackgroundWithUrl(
        "http://localhost:3000",
      );

      expect(result).toBe(expectedAlias);
      expect(mockGenerateEmailAlias).toHaveBeenCalledWith([
        "marketing",
        "localhost",
      ]);
    });

    it("should handle IP addresses", async () => {
      const expectedAlias = "marketing-192.168.1.1@example.com";
      mockGenerateEmailAlias.mockResolvedValue(expectedAlias);

      const result = await generateAliasForBackgroundWithUrl(
        "http://192.168.1.1:8080",
      );

      expect(result).toBe(expectedAlias);
      expect(mockGenerateEmailAlias).toHaveBeenCalledWith([
        "marketing",
        "192.168.1.1",
      ]);
    });

    it("should throw ApiError when generation fails with Error", async () => {
      const originalError = new Error("Network error");
      mockGenerateEmailAlias.mockRejectedValue(originalError);

      await expect(
        generateAliasForBackgroundWithUrl("https://example.com"),
      ).rejects.toThrow(ApiError);
      await expect(
        generateAliasForBackgroundWithUrl("https://example.com"),
      ).rejects.toThrow("Network error");
    });

    it("should throw ApiError with generic message when generation fails with non-Error", async () => {
      mockGenerateEmailAlias.mockRejectedValue({ code: "UNKNOWN" });

      await expect(
        generateAliasForBackgroundWithUrl("https://example.com"),
      ).rejects.toThrow(ApiError);
      await expect(
        generateAliasForBackgroundWithUrl("https://example.com"),
      ).rejects.toThrow("Failed to generate alias");
    });

    it("should handle URLs with subdomains correctly", async () => {
      const expectedAlias = "marketing-api.github@example.com";
      mockGenerateEmailAlias.mockResolvedValue(expectedAlias);

      const result = await generateAliasForBackgroundWithUrl(
        "https://api.github.com/v1/users",
      );

      expect(result).toBe(expectedAlias);
      expect(mockGenerateEmailAlias).toHaveBeenCalledWith([
        "marketing",
        "api.github.com",
      ]);
    });

    it("should handle file:// URLs gracefully", async () => {
      const expectedAlias = "marketing-website@example.com";
      mockGenerateEmailAlias.mockResolvedValue(expectedAlias);

      const result = await generateAliasForBackgroundWithUrl(
        "file:///path/to/file.html",
      );

      expect(result).toBe(expectedAlias);
      expect(mockGenerateEmailAlias).toHaveBeenCalledWith([
        "marketing",
        "website",
      ]);
    });
  });
});
