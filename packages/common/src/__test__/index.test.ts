import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from '@jest/globals';
import * as api from '../index.js';
import browser from 'webextension-polyfill';

// Mock the browser storage API
const mockStorage = () => {
  const store: Record<string, any> = {};
  return {
    get: jest.fn(async (keys?: string | string[] | object | null) => {
      if (!keys) return store;
      if (typeof keys === 'string') return { [keys]: store[keys] };
      if (Array.isArray(keys))
        return keys.reduce((acc, k) => ({ ...acc, [k]: store[k] }), {});
      return {};
    }),
    set: jest.fn(async (items: object) => {
      Object.assign(store, items);
    }),
    remove: jest.fn(async (keys: string | string[]) => {
      if (typeof keys === 'string') delete store[keys];
      else keys.forEach((k) => delete store[k]);
    }),
    clear: jest.fn(async () => {
      for (const key in store) delete store[key];
    }),
  };
};

describe('email-alias-extensions/common', () => {
  let mockLocalStorage: ReturnType<typeof mockStorage>;

  beforeEach(() => {
    mockLocalStorage = mockStorage();

    // Mock only the storage.local methods we use
    (browser.storage.local as any) = mockLocalStorage;
    jest.spyOn(browser.storage.local, 'get');
    jest.spyOn(browser.storage.local, 'set');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should save and get token', async () => {
    await api.saveToken('my-secret-token');
    const token = await api.getToken();
    expect(token).toBe('my-secret-token');
    expect(browser.storage.local.set).toHaveBeenCalledWith({
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
    await mockLocalStorage.set({ 'email-alias-token': null });
    await api.saveDomain('example.com');
    await expect(api.generateEmailAlias('foo')).rejects.toThrow(
      'Authentication token is not set'
    );
  });

  it('should throw if domain is not set when generating alias', async () => {
    await api.saveToken('my-secret-token');
    await mockLocalStorage.set({ 'email-alias-domain': null });
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

    expect(alias).toBeDefined();
    expect(typeof alias).toBe('string');
    expect(alias.startsWith(prefix)).toBe(true);
    expect(alias.endsWith(`@${domain}`)).toBe(true);
  });
});
