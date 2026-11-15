import {color as d3Color} from "d3-color";

const colorByValue = new Map();

// The CSS keyword currentColor is the color of the text, black by default, as on Canvas.
function isCurrentColor(value) {
  return /^currentcolor$/i.test(value);
}

function isNone(value) {
  return /^none$/i.test(value);
}

// Whether a value is a CSS color, including none and currentColor.
export function isColor(value) {
  value = `${value}`.toLowerCase().trim();
  return value === "none" || value === "currentcolor" || d3Color(value) !== null;
}

export function rgba(value) {
  if (colorByValue.has(value)) return colorByValue.get(value);
  const color = d3Color(isCurrentColor(value) ? "black" : value).rgb();
  colorByValue.set(value, color);
  return color;
}

export function normalizeColor(color, opacity) {
  if (color === undefined) return color;
  if (color === "transparent" || isNone(color)) return [0, 0, 0, 0];
  const {r, g, b, opacity: a} = rgba(color);
  return [r, g, b, ((opacity ?? a ?? 1) * 255) | 0];
}

export function normalizeColorString(color, opacity) {
  if (typeof color !== "string") return color;
  const [r, g, b, a] = normalizeColor(color, opacity);
  return `rgba(${r},${g},${b},${a / 255})`;
}

// RGBA bytes for WebGL. A nullish color, such as {fill: null}, is transparent: nothing is drawn.
export function colorBytes(color) {
  return color == null ? [0, 0, 0, 0] : normalizeColor(color);
}
