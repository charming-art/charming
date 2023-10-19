export function flow$each(callback) {
  const groups = this._groups;
  const m = groups.length;
  for (let j = 0; j < m; j++) {
    const group = groups[j];
    for (let i = 0; i < group.length; i++) {
      const datum = group[i];
      callback.call(this, datum, i, group, this);
    }
  }
  return this;
}
