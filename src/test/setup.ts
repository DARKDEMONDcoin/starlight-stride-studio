import "@testing-library/jest-dom/vitest";

Object.defineProperty(window, "scrollTo", {
  writable: true,
  value: () => {},
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// jsdom lacks these; components that reveal on scroll or measure themselves
// would otherwise throw during render and never paint.
class NoopObserver {
  callback: (entries: unknown[], observer: unknown) => void;
  constructor(callback: (entries: unknown[], observer: unknown) => void) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

if (!("IntersectionObserver" in window)) {
  Object.defineProperty(window, "IntersectionObserver", {
    writable: true,
    configurable: true,
    value: NoopObserver,
  });
}

if (!("ResizeObserver" in window)) {
  Object.defineProperty(window, "ResizeObserver", {
    writable: true,
    configurable: true,
    value: NoopObserver,
  });
}

