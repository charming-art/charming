import {context2d} from "../../canvas/context2d.js";

export function canvas$init({width, height, dpi}) {
  const context = context2d({width, height, dpr: dpi ?? devicePixelRatio});
  Object.assign(this, {_context: context});
  Object.assign(this._props, {width, height});
  return this;
}
