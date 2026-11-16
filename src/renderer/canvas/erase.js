// Clears everything drawn, so that a transition draws each frame afresh.
export function canvas$erase() {
  const {width, height} = this._props;
  this._context.clearRect(0, 0, width, height);
  return this;
}
