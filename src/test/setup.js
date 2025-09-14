// Test setup for vitest
import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock environment variables
import.meta.env = {
  ...import.meta.env,
  VITE_ANTHROPIC_API_KEY: 'test-api-key',
  ANTHROPIC_API_KEY: 'test-api-key'
};

// Mock localStorage
const localStorageMock = (() => {
  let data = {};

  return {
    getItem: vi.fn((key) => data[key] || null),
    setItem: vi.fn((key, value) => { data[key] = value; }),
    removeItem: vi.fn((key) => { delete data[key]; }),
    clear: vi.fn(() => { data = {}; }),
    key: vi.fn((index) => Object.keys(data)[index] || null),
    get length() {
      return Object.keys(data).length;
    },
    // Make it iterable like real localStorage
    [Symbol.iterator]: function* () {
      for (let key of Object.keys(data)) {
        yield key;
      }
    },
    _data: data
  };
})();

// Make localStorage keys enumerable for Object.keys() to work
Object.defineProperty(localStorageMock, Symbol.iterator, {
  enumerable: false,
  writable: false,
  value: function* () {
    for (let key of Object.keys(localStorageMock._data)) {
      yield key;
    }
  }
});

// Add missing methods to make it more like real localStorage
Object.setPrototypeOf(localStorageMock, {
  ...Object.prototype,
  // Make Object.keys work on localStorage
  [Symbol.for('nodejs.util.inspect.custom')]() {
    return localStorageMock._data;
  }
});

// Make Object.keys work on localStorage mock
const originalKeys = Object.keys;
Object.keys = function(obj) {
  if (obj === localStorageMock) {
    return originalKeys(localStorageMock._data);
  }
  return originalKeys(obj);
};

// Create global window object for Node environment
global.window = global.window || {};
global.localStorage = localStorageMock;

// Reset localStorage mock before each test
beforeEach(() => {
  localStorageMock._data = {};
  localStorageMock.getItem.mockImplementation((key) => localStorageMock._data[key] || null);
  localStorageMock.setItem.mockImplementation((key, value) => {
    localStorageMock._data[key] = value;
  });
  localStorageMock.removeItem.mockImplementation((key) => {
    delete localStorageMock._data[key];
  });
  localStorageMock.clear.mockImplementation(() => {
    localStorageMock._data = {};
  });
});