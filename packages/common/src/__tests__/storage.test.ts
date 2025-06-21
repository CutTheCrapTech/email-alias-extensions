import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveSettings, loadSettings, ExtensionSettings } from '../storage';
import browser from 'webextension-polyfill';

// --- Mocking the `webextension-polyfill` library ---
// We mock the entire module to control the behavior of `browser.storage.sync`.
vi.mock('webextension-polyfill', () => {
  // A simple in-memory store to simulate the browser's storage
  let memoryStore: { [key: string]: any } = {};

  return {
    default: {
      storage: {
        sync: {
          // Mock `set` to store data in our in-memory store
          set: vi.fn((data) => {
            Object.assign(memoryStore, data);
            return Promise.resolve();
          }),
          // Mock `get` to retrieve data from our in-memory store
          get: vi.fn((key) => {
            return Promise.resolve({ [key as string]: memoryStore[key as string] });
          }),
          // A helper function for our tests to clear the store
          _clear: () => {
            memoryStore = {};
          },
        },
      },
    },
  };
});

describe('Storage Module', () => {
  // Before each test, clear the mock history and our in-memory store
  beforeEach(() => {
    vi.clearAllMocks();
    (browser.storage.sync as any)._clear();
  });

  describe('saveSettings', () => {
    it('should call browser.storage.sync.set with the correct key and settings', async () => {
      const settings: ExtensionSettings = {
        domain: 'example.com',
        token: 'secret-token',
      };

      await saveSettings(settings);

      // We expect `set` to have been called once
      expect(browser.storage.sync.set).toHaveBeenCalledOnce();
      // And we expect it to have been called with an object where our settings are nested under 'extension_settings'
      expect(browser.storage.sync.set).toHaveBeenCalledWith({
        extension_settings: settings,
      });
    });
  });

  describe('loadSettings', () => {
    it('should return the saved settings when they exist', async () => {
      // First, manually "save" settings to our mock store
      const settings: ExtensionSettings = {
        domain: 'test.com',
        token: 'another-token',
      };
      await browser.storage.sync.set({ extension_settings: settings });

      // Now, try to load them
      const loaded = await loadSettings();

      // We expect `get` to have been called with the correct key
      expect(browser.storage.sync.get).toHaveBeenCalledWith('extension_settings');
      // And we expect the loaded settings to match what we saved
      expect(loaded).toEqual(settings);
    });

    it('should return an empty object when no settings are saved', async () => {
      // Ensure the store is empty, then try to load settings
      const loaded = await loadSettings();

      expect(browser.storage.sync.get).toHaveBeenCalledWith('extension_settings');
      // The result should be an empty object, not null or undefined
      expect(loaded).toEqual({});
    });
  });
});
