// Removes everything drawn, so that a transition draws each frame afresh.
export function svg$erase() {
  this._node.replaceChildren();
  this._group = this._node;
  this._stack = [];
  return this;
}
