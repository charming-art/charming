import {arcPath} from "../../core/arc.js";

export function svg$arc(options) {
  return this.path(arcPath(options));
}
