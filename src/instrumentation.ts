export async function register() {
  if (typeof globalThis.DOMMatrix === 'undefined') {
    // Minimal polyfills for pdfjs-dist in Node.js (text extraction only, no rendering)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g = globalThis as any;
    g.DOMMatrix = class DOMMatrix {
      constructor() {
        return new Proxy(this, { get: () => 0 });
      }
    };
    g.ImageData = class ImageData {
      width = 0;
      height = 0;
      data = new Uint8ClampedArray();
    };
    g.Path2D = class Path2D {};
  }
}
