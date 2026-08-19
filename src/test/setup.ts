import '@testing-library/jest-dom';

window.matchMedia = window.matchMedia || function () {
  return {
    matches: false,
    addListener: function () {},
    removeListener: function () {},
  };
} as unknown as typeof window.matchMedia;
