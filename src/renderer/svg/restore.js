export function svg$restore() {
  const group = this._group;
  if (group === this._node) return;
  this._group = this._stack.pop();
  if (!group.hasChildNodes()) group.remove();
}
