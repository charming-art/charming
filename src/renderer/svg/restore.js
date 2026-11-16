export function svg$restore() {
  const group = this._group;
  if (!this._stack.length) return;
  this._group = this._stack.pop();
  // An empty group is removed, unless elements are reused, as its place is kept for the next frame.
  if (!this._cursors && !group.hasChildNodes()) group.remove();
}
