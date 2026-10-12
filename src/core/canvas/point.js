import {canvas$circle} from "./circle.js";

export function canvas$point({stroke = "#000", ...rest}) {
  return canvas$circle.call(this, {...rest, stroke, r: 1});
}
