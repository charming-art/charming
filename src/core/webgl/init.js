function contextGL(width, height, dpr) {
  if (dpr == null) dpr = devicePixelRatio;
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl");
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = width + "px";
  canvas.style.height = height + "px";
  gl.viewport(0, 0, width * dpr, height * dpr);
  return gl;
}

export function webgl$init({width, height, dpi = null}) {
  const gl = contextGL(width, height, dpi);
  Object.assign(this._props, {width, height});
  Object.assign(this, {_gl: gl});
  return this;
}
