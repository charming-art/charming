function renderData(renderer, node, dimension) {
  const { _shape, _data, _value, _children } = node;
  const I = _data.map((_, i) => i);
  if (_shape) {
    const { render } = _shape;
    render(renderer, I, _value, dimension);
  }
  if (!_children.length) return;
  for (const i of I) {
    if (_value) {
      const { x: X, y: Y, rotate: R = [] } = _value;
      const x = X[i];
      const y = Y[i];
      const r = R[i];
      renderer.save();
      renderer.translate(x, y);
      if (r !== undefined) renderer.rotate(r);
    }
    _children.forEach((d) => renderData(renderer, d, dimension));
    if (_value) {
      renderer.restore();
    }
  }
}

export function app$render() {
  const renderer = this._renderer;
  const dimension = {
    width: this.width(),
    height: this.height(),
  };
  this._data.forEach((d) => renderData(renderer, d, dimension));
  this._data = [];
  return this.node();
}
