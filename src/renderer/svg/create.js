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

export function paint({fill, fillOpacity, stroke, strokeOpacity, strokeWidth}) {
  return {
    fill: fill,
    "fill-opacity": fillOpacity,
    stroke: stroke,
    "stroke-opacity": strokeOpacity,
    "stroke-width": strokeWidth,
  };
}
