export function svg$restore() {
  const group = this._group;
  if (!this._stack.length) return;
  this._group = this._stack.pop();
  if (!group.hasChildNodes()) group.remove();
}
