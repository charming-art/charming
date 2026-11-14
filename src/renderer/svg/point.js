import {svg$circle} from "./circle.js";

export function svg$point({stroke = "#000", ...rest}) {
  return svg$circle.call(this, {...rest, stroke, r: 1});
}
