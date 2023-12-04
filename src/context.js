export function context2d(width = 640, height = 480, dpr = null) {
  if (dpr == null) dpr = devicePixelRatio;
  const canvas = document.createElement("canvas");
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = width + "px";
  canvas.style.height = height + "px";
  const context = canvas.getContext("2d");
  context.scale(dpr, dpr);
  return context;
}

export function contextGL(width, height, dpr) {
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
