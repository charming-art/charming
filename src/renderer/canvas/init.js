import {context2d} from "../../util/context2d/context2d.js";

// A width or height that isn't given is auto: a transform such as cm.plane may resize it.
export function canvas$init({width, height, dpi}) {
  const auto = {width: width === undefined, height: height === undefined};
  width ??= 640;
  height ??= 480;
  const dpr = dpi ?? devicePixelRatio;
  const context = context2d({width, height, dpr});
  Object.assign(this, {_context: context});
  Object.assign(this._props, {width, height, dpr, auto});
  return this;
}
