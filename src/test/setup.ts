import '@testing-library/jest-dom';

if (typeof window !== 'undefined') {
  window.matchMedia = window.matchMedia || function () {
    return {
      matches: false,
      addListener: function () {},
      removeListener: function () {},
    };
  } as unknown as typeof window.matchMedia;
}
