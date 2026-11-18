import {arcPath} from "../../core/arc.js";

export function canvas$arc(options) {
  return this.path(arcPath(options));
}
