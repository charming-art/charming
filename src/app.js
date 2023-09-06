import { Data } from "./data.js";

function createContext(document, width = 640, height = 480, dpi = null) {
  if (dpi == null) dpi = devicePixelRatio;
  const canvas = document.createElement("canvas");
  canvas.width = width * dpi;
  canvas.height = height * dpi;
  canvas.style.width = width + "px";
  canvas.style.height = height + "px";
  const context = canvas.getContext("2d");
  context.scale(dpi, dpi);
  return context;
}

function normalizeProperty(property) {
  if (typeof property === "object") return property;
  if (typeof property === "function") return { value: property };
  return { value: () => property };
}

function scaleLinear(domain, range) {
  const [d, d1] = domain;
  const [r, r1] = range;
  return (x) => {
    const t = (x - d) / (d1 - d);
    return r * (1 - t) + t * r1;
  };
}

function extent(array) {
  return [Math.min(...array), Math.max(...array)];
}

function normalizeOptions(options) {
  return Object.entries(options).map(([key, value]) => [
    key,
    normalizeProperty(value),
  ]);
}

function app$node() {
  return this._context.canvas;
}

function app$data(data) {
  const newData = new Data(data);
  this._data.push(newData);
  return newData;
}

function app$width() {
  return this._width;
}

function app$height() {
  return this._height;
}

function app$render() {
  for (const stream of this._data) {
    const { maps, shapes, data } = stream.value();
    const mapped = maps.reduce((data, map) => data.map(map), data);
    const I = mapped.map((_, i) => i);
    for (const shape of shapes) {
      const { render, options } = shape;
      const normalized = normalizeOptions(options);
      const values = normalized.map(([key, property]) => {
        const { value, range } = property;
        const V = mapped.map(value);
        if (!range) return [key, V];
        const domain = extent(V);
        const scale = scaleLinear(domain, range);
        const scaled = V.map(scale);
        return [key, scaled];
      });
      render(this._context, I, Object.fromEntries(values));
    }
  }
  return this;
}

function App({
  width = 640,
  height = 480,
  document = window.document,
  dpi = null,
} = {}) {
  Object.defineProperties(this, {
    _data: { value: [] },
    _context: { value: createContext(document, width, height, dpi) },
    _width: { value: width },
    _height: { value: height },
  });
}

Object.defineProperties(App.prototype, {
  data: { value: app$data },
  node: { value: app$node },
  width: { value: app$width },
  height: { value: app$height },
  render: { value: app$render },
});

export function app(options) {
  return new App(options);
}
