import {append, drawn} from "./create.js";

// Adds a transform to the current group. Shapes already drawn keep their position, and a clip its
// coordinates, so a group with children, a clipped group (or the root) gets a new nested group.
export function transform(renderer, value) {
  let group = renderer._group;
  if (group === renderer._node || drawn(renderer, group) || group.hasAttribute("clip-path")) {
    group = append(renderer, "g", {});
    renderer._group = group;
  }
  const previous = group.getAttribute("transform");
  group.setAttribute("transform", previous ? `${previous} ${value}` : value);
}
