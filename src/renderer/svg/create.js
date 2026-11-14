import {color} from "d3-color";

const namespace = "http://www.w3.org/2000/svg";

// Creates an SVG element with the defined attributes, skipping null and undefined values.
export function create(name, attributes = {}) {
  const node = document.createElementNS(namespace, name);
  for (const key in attributes) {
    const value = attributes[key];
    if (value != null) node.setAttribute(key, value);
  }
  return node;
}

// Appends an element to the current group of the renderer.
export function append(renderer, name, attributes) {
  const node = create(name, attributes);
  renderer._group.append(node);
  return node;
}

export function degrees(radians) {
  return (radians * 180) / Math.PI;
}

// Like Canvas, an explicit opacity replaces the alpha of the color instead of multiplying it.
function opaque(value, opacity) {
  if (opacity == null || typeof value !== "string") return value;
  const c = color(value);
  return c && c.opacity !== 1 ? c.copy({opacity: 1}).formatRgb() : value;
}

export function paint({fill, fillOpacity, stroke, strokeOpacity, strokeWidth}) {
  return {
    fill: opaque(fill, fillOpacity),
    "fill-opacity": fillOpacity,
    stroke: opaque(stroke, strokeOpacity),
    "stroke-opacity": strokeOpacity,
    "stroke-width": strokeWidth,
  };
}
