// Ends a frame started by erase: the elements that weren't reused, such as marks that have exited,
// are removed.
export function svg$render() {
  const cursors = this._cursors;
  if (!cursors) return this;
  if (!cursors.has(this._node)) cursors.set(this._node, {next: this._node.firstChild});
  for (const {next} of cursors.values()) {
    for (let node = next; node; ) {
      const sibling = node.nextSibling;
      node.remove();
      node = sibling;
    }
  }
  this._cursors = null;
  return this;
}
