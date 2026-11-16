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

// Appends an element to the current group of the renderer. Between erase and render, such as in the
// frames of a transition, the element drawn at the same place last time is reused instead, if it
// has the same name, so that only its attributes change.
export function append(renderer, name, attributes) {
  const group = renderer._group;
  const cursors = renderer._cursors;
  if (!cursors) {
    const node = create(name, attributes);
    group.append(node);
    return node;
  }
  // The cursor of a group is the element to reuse next, and how many have been drawn.
  let cursor = cursors.get(group);
  if (!cursor) {
    cursor = {next: group.firstChild, n: 0};
    cursors.set(group, cursor);
  }
  const child = cursor.next;
  let node = child;
  if (child && child.localName === name) update(child, attributes);
  else {
    node = create(name, attributes);
    group.insertBefore(node, child);
  }
  cursor.next = node.nextSibling;
  cursor.n++;
  return node;
}

// Sets the defined attributes of an element that changed, and removes the others.
function update(node, attributes) {
  for (const {name} of Array.from(node.attributes)) {
    if (attributes[name] == null) node.removeAttribute(name);
  }
  for (const key in attributes) {
    const value = attributes[key];
    if (value != null && node.getAttribute(key) !== `${value}`) node.setAttribute(key, value);
  }
}

// Whether something has been drawn in a group, in this frame if elements are reused.
export function drawn(renderer, group) {
  const cursors = renderer._cursors;
  return cursors ? (cursors.get(group)?.n ?? 0) > 0 : group.hasChildNodes();
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
