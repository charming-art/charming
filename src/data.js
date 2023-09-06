function data$map(callback) {
  this._maps.push(callback);
  return this;
}

function data$shape(render, options) {
  this._shapes.push({ render, options });
  return this;
}

function data$value() {
  return {
    maps: this._maps,
    shapes: this._shapes,
    data: this._data,
  };
}

export function Data(data) {
  Object.defineProperties(this, {
    _maps: { value: [] },
    _shapes: { value: [] },
    _data: { value: data },
  });
}

Object.defineProperties(Data.prototype, {
  map: { value: data$map },
  shape: { value: data$shape },
  value: { value: data$value },
});
