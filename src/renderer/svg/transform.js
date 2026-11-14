import {create} from "./create.js";

// Adds a transform to the current group. Shapes already drawn keep their position,
// so a group with children (or the root) gets a new nested group instead.
export function transform(renderer, value) {
  let group = renderer._group;
  if (group === renderer._node || group.hasChildNodes()) {
    renderer._group.append((group = create("g")));
    renderer._group = group;
  }
  const previous = group.getAttribute("transform");
  group.setAttribute("transform", previous ? `${previous} ${value}` : value);
}
