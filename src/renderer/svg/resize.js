export function svg$resize(width, height) {
  const props = this._props;
  if (props.width === width && props.height === height) return this;
  const node = this._node;
  node.setAttribute("width", width);
  node.setAttribute("height", height);
  node.setAttribute("viewBox", `0 0 ${width} ${height}`);
  Object.assign(props, {width, height});
  return this;
}
