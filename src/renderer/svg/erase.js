// Starts a new frame, such as one of a transition: what's drawn until render reuses the elements
// drawn before, in order, rather than creating them again.
export function svg$erase() {
  this._group = this._node;
  this._stack = [];
  this._cursors = new Map();
  // The clip paths are drawn again, in order, so that each frame reuses their ids.
  this._clips = new Map();
  return this;
}
