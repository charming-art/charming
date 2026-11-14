import {normalizeColor} from "../../core/color.js";

export function webgl$clear({fill}) {
  const gl = this._gl;
  const [r, g, b, a] = normalizeColor(fill);
  gl.clearColor(r / 255, g / 255, b / 255, a / 255);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}
