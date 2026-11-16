import {append} from "./create.js";

export function svg$save() {
  const group = append(this, "g", {});
  this._stack.push(this._group);
  this._group = group;
}
