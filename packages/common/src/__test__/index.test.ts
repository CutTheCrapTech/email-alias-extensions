// Jest test file for email-alias-extensions/common
import * as core from 'email-alias-core';
import * as api from '../index.js';

declare const global: any;

describe('email-alias-extensions/common', () => {
  beforeEach(() => {
    // Mock browser.storage.local
    global.browser = {
      storage: {
        local: {
          _store: {},
          async set(obj: Record<string, any>) {
            Object.assign(this._store, obj);
          },
          async get(key: string) {
            if (typeof key === 'string') {
              return { [key]: this._store[key] };
            }
            // handle array or object
            const result: Record<string, any> = {};
            for (const k of key) {
              result[k] = this._store[k];
            }
            return result;
          },
        },
      },
    };
  });

  afterEach(() => {
    delete global.browser;
    jest.restoreAllMocks();
  });

  it('should save and get token', async () => {
    await api.saveToken('mytoken');
    const token = await (api as any).getToken();
    expect(token).toBe('mytoken');
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
    await expect(api.generateEmailAlias('foo')).rejects.toThrow('Authentication token is not set');
  });

  it('should throw if domain is not set when generating alias', async () => {
    await api.saveToken('mytoken');
    await expect(api.generateEmailAlias('foo')).rejects.toThrow('Domain is not set');
  });

  it('should call coreGenerateEmailAlias with correct args', async () => {
    await api.saveToken('tok');
    await api.saveDomain('bar.com');
    const spy = jest.spyOn(core, 'generateEmailAlias').mockResolvedValue('alias@bar.com');
    const alias = await api.generateEmailAlias('prefix');
    expect(alias).toBe('alias@bar.com');
    expect(spy).toHaveBeenCalledWith({
      secretKey: 'tok',
      aliasParts: ['prefix'],
      domain: 'bar.com',
    });
  });
}); 