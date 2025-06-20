import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from '@jest/globals';
import * as api from '../index.js';

// Define a simplified type for our mock `browser` object to satisfy TypeScript.
// This makes the mock's shape explicit and avoids using `any`.
type MockBrowser = {
  storage: {
    local: {
      get: jest.Mock<(key: string) => Promise<Record<string, unknown>>>;
      set: jest.Mock<(items: Record<string, unknown>) => Promise<void>>;
    };
  };
};

// Extend the `globalThis` type to include our optional `browser` mock.
declare let globalThis: {
  browser?: MockBrowser;
};

describe('email-alias-extensions/common', () => {
  // This will hold our in-memory storage for each test.
  let store: Record<string, unknown>;

  beforeEach(() => {
    // Reset the store for each test to ensure isolation.
    store = {};

    // Mock the browser API with a simplified implementation.
    globalThis.browser = {
      storage: {
        local: {
          get: jest.fn(async (key: string) => {
            return { [key]: store[key] };
          }),
          set: jest.fn(async (items: Record<string, unknown>) => {
            Object.assign(store, items);
          }),
        },
      },
    };
  });

  afterEach(() => {
    // Clean up mocks and the global object.
    jest.restoreAllMocks();
    delete globalThis.browser;
  });

  it('should save and get token', async () => {
    await api.saveToken('my-secret-token');
    const token = await api.getToken();
    expect(token).toBe('my-secret-token');
    // Verify that `set` was called correctly.
    expect(globalThis.browser?.storage.local.set).toHaveBeenCalledWith({
      'email-alias-token': 'my-secret-token',
    });
  });

  it('should save and get domain', async () => {
    await api.saveDomain('example.com');
    const domain = await api.getDomain();
    expect(domain).toBe('example.com');
  });

  it('should throw if token is empty', async () => {
    await expect(api.saveToken('')).rejects.toThrow('Token cannot be empty.');
  });

  it('should throw if domain is empty', async () => {
    await expect(api.saveDomain('')).rejects.toThrow('Domain cannot be empty.');
  });

  it('should throw if token is not set when generating alias', async () => {
    await api.saveDomain('example.com');
    // Manually ensure token is not in the store for this test.
    store['email-alias-token'] = null;
    await expect(api.generateEmailAlias('foo')).rejects.toThrow(
      'Authentication token is not set'
    );
  });

  it('should throw if domain is not set when generating alias', async () => {
    await api.saveToken('my-secret-token');
    // Manually ensure domain is not in the store for this test.
    store['email-alias-domain'] = null;
    await expect(api.generateEmailAlias('foo')).rejects.toThrow(
      'Domain is not set'
    );
  });

  it('should generate a valid email alias using the core library', async () => {
    const secretKey = 'a-super-secret-key-that-is-long-enough';
    const domain = 'example.com';
    const prefix = 'test';

    await api.saveToken(secretKey);
    await api.saveDomain(domain);

    const alias = await api.generateEmailAlias(prefix);

    // The expected output from `email-alias-core` is deterministic, but we'll
    // just check the format to make the test more robust.
    // Expected format: <prefix><hash>@<domain>
    expect(alias).toBeDefined();
    expect(typeof alias).toBe('string');
    expect(alias.startsWith(prefix)).toBe(true);
    expect(alias.endsWith(`@${domain}`)).toBe(true);
  });
});
