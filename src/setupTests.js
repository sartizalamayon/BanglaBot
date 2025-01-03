import '@testing-library/jest-dom';
import { vi } from 'vitest'

// Mock matchmedia
window.matchMedia = window.matchMedia || function() {
  return {
    matches: false,
    addListener: function() {},
    removeListener: function() {}
  };
};
