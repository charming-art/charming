import {append} from "./create.js";

export function svg$clear({fill}) {
  // Clearing the root removes what was drawn before, so animations don't add nodes forever.
  if (this._group === this._node) this._node.replaceChildren();
  append(this, "rect", {width: this._props.width, height: this._props.height, fill});
  return this;
}
