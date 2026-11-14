import {create} from "./create.js";

export function svg$save() {
  const group = create("g");
  this._group.append(group);
  this._stack.push(this._group);
  this._group = group;
}
