import {append} from "./create.js";

// Clips what's drawn next, until restore, to a rect {x, y, width, height}, or to a path {x, y, d}
// at x and y, in the current coordinates. What's clipped is drawn in a group of its own, like a
// transform, as a clip is in the coordinates of the group it applies to, which a later transform
// mustn't change. Clips of the same shape in a frame share a clip path, such as those of the
// primitives of a transition, which are each drawn in their own group.
export function svg$clip({x = 0, y = 0, width, height, d}) {
  const key = d === undefined ? `${x},${y},${width},${height}` : `${x},${y},${d}`;
  let id = this._clips.get(key);
  if (id === undefined) {
    id = `${this._clipPrefix}-${this._clips.size}`;
    this._clips.set(key, id);
    const parent = this._group;
    this._group = append(this, "clipPath", {id, clipPathUnits: "userSpaceOnUse"});
    if (d === undefined) append(this, "rect", {x, y, width, height});
    else append(this, "path", {d, transform: x || y ? `translate(${x},${y})` : null});
    this._group = parent;
  }
  this._group = append(this, "g", {"clip-path": `url(#${id})`});
  return this;
}
