export function terminal$clear({fill = "#000"}) {
  const {pixelWidth, pixelHeight} = this._props;
  // Shapes drawn before the clear are queued in the backend: discard them.
  this._backend.clear();
  this._buffer.length = 0;
  this._context.fillStyle = fill;
  this._context.fillRect(0, 0, pixelWidth, pixelHeight);
}
