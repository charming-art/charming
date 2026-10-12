export function flow$renderer(renderer) {
  if (arguments.length === 0) return this._context.renderer;
  this._context.renderer = renderer;
  return this;
}
