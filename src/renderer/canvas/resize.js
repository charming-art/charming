// Resizes the canvas, like context2d. Setting the size of a canvas clears it, so nothing is
// done if the size is unchanged.
export function canvas$resize(width, height) {
  const props = this._props;
  if (props.width === width && props.height === height) return this;
  const context = this._context;
  const {canvas} = context;
  const {dpr} = props;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = width + "px";
  canvas.style.height = height + "px";
  context.scale(dpr, dpr);
  Object.assign(props, {width, height});
  return this;
}
