// Starts a new frame, such as one of a transition: what's drawn until render reuses the elements
// drawn before, in order, rather than creating them again.
export function svg$erase() {
  this._group = this._node;
  this._stack = [];
  this._cursors = new Map();
  return this;
}
