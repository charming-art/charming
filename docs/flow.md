# Charming Flow

**Charming Flow** binds data to shapes and renders them. A **flow** holds data. Appending a shape to a flow draws one instance per datum, with each attribute computed from the data. All flows created from the same root share a **renderer**, and _flow_.render() draws everything appended to them.

```js eval code=false
(() => {
  const renderer = cm.canvas({width: 640, height: 640});
  const root = cm.flow().renderer(renderer);

  root
    .data(Array.from({length: 120}, (_, i) => (i * Math.PI) / 120))
    .append(cm.circle, {
      x: (t) => Math.cos(t) * Math.cos(t * 3),
      y: (t) => Math.sin(t) * Math.cos(t * 3),
      r: (t) => t,
      fill: "black",
    })
    .transform(cm.mapPosition, {padding: 30})
    .transform(cm.mapAttrs, {r: {range: [8, 15]}});

  root.render();

  return renderer.node();
})();
```

```js
const renderer = cm.canvas({width: 640, height: 640});
const root = cm.flow().renderer(renderer);

root
  .data(Array.from({length: 120}, (_, i) => (i * Math.PI) / 120))
  .append(cm.circle, {
    x: (t) => Math.cos(t) * Math.cos(t * 3),
    y: (t) => Math.sin(t) * Math.cos(t * 3),
    r: (t) => t,
    fill: "black",
  })
  .transform(cm.mapPosition, {padding: 30})
  .transform(cm.mapAttrs, {r: {range: [8, 15]}});

root.render();
```

A drawing goes through three stages, and a flow has a method for each:

- **[process](#flow-process)** prepares the data, for example by filtering or mapping it.
- **[append](#flow-append)** binds each datum to a shape and computes its attributes.
- **[transform](#flow-transform)** derives the final attribute values, for example by mapping them to the canvas with scales.

_flow_.data, _flow_.datum, _flow_.append, _flow_.process and _flow_.transform return a new flow, while _flow_.call, _flow_.render and _flow_.renderer(_renderer_) return the same flow, so calls chain.

## _cm_.flow() {#cm-flow}

Returns a new **root flow**. Set its renderer with [_flow_.renderer](#flow-renderer), append shapes to it, then call [_flow_.render](#flow-render).

```js
const root = cm.flow().renderer(cm.canvas({width: 200, height: 100}));
```

## _flow_.renderer(_[renderer]_) {#flow-renderer}

If _renderer_ is specified, sets the renderer of this flow and returns this flow. All flows created from the same root share it. If _renderer_ isn't specified, returns the current renderer, which defaults to `null`.

The renderers are [_cm_.canvas](#cm-canvas), [_cm_.webgl](/webgl#cm-webgl) and [_cm_.terminal](/terminal#cm-terminal). Set the renderer before using transforms that depend on its size, such as [_cm_.mapPosition](/transform#cm-map-position).

```js
const renderer = cm.canvas({width: 200, height: 100});
const root = cm.flow().renderer(renderer);

root.renderer(); // renderer
root.data([1, 2]).renderer(); // renderer
```

## _flow_.render() {#flow-render}

Draws every shape appended to flows created from the same root, then clears them, and returns this flow. It can be called on any of those flows. It throws an error if no renderer is set.

Because the shapes are cleared, a frame is drawn by appending its shapes and calling render, then doing it again for the next frame. See [Animating](#animating).

```js
const root = cm.flow().renderer(cm.canvas({width: 200, height: 100}));

root.append(cm.circle, {x: 100, y: 50, r: 40, fill: "steelblue"});

root.render();
```

## _flow_.data(_[data]_) {#flow-data}

If _data_ is an array, returns a new flow holding it.

```js
const flow = root.data([1, 2, 3]);
flow.data(); // [[1, 2, 3]]
```

If the flow has a group for each datum of a parent, such as after appending a [group](/shape#cm-group), _data_ should be a function. It's called for each parent datum, being passed the datum (_d_), the index (_i_), the group (_data_) and this flow (_flow_), and returns the child data. For example, to draw a matrix:

```js eval code=false
(() => {
  const renderer = cm.canvas({width: 200, height: 120});
  const root = cm.flow().renderer(renderer);

  root
    .data([
      [1, 0, 1, 1],
      [0, 1, 1, 0],
      [1, 1, 0, 1],
    ])
    .append(cm.group, {x: 30, y: (_, i) => i * 30 + 30})
    .data((row) => row)
    .append(cm.circle, {x: (_, i) => i * 46, y: 0, r: 10, fill: (d) => (d ? "black" : "#ddd")});

  root.render();

  return renderer.node();
})();
```

```js
root
  .data([
    [1, 0, 1, 1],
    [0, 1, 1, 0],
    [1, 1, 0, 1],
  ])
  .append(cm.group, {x: 30, y: (_, i) => i * 30 + 30})
  .data((row) => row)
  .append(cm.circle, {x: (_, i) => i * 46, y: 0, r: 10, fill: (d) => (d ? "black" : "#ddd")});
```

If _data_ isn't specified, returns the groups of this flow.

## _flow_.datum(_[datum]_) {#flow-datum}

Like [_flow_.data](#flow-data), but takes a single _datum_.

```js
root.datum(1);

// Equivalent
root.data([1]);
```

## _flow_.append(_shape[, options]_) {#flow-append}

Appends a [_shape_](/shape) for each datum of this flow and returns a new flow, which child shapes can be appended to. Each option sets an attribute:

- A **constant** is the same for every shape: `fill: "red"`.
- A **function** is called for each datum, being passed the datum (_d_), the index (_i_) and the data (_data_): `x: (d) => d * 10`.
- An **array** gives one value per shape, by index.
- A [_cm_.constant](/shape#cm-constant) passes its value to [composite shapes](/shape#composite-shapes) unchanged.

```js eval code=false
(() => {
  const renderer = cm.canvas({width: 200, height: 100});
  const root = cm.flow().renderer(renderer);

  root.data([1, 2, 3]).append(cm.circle, {x: (d) => d * 50, y: 50, r: (d) => d * 8, fill: "steelblue"});

  root.render();

  return renderer.node();
})();
```

```js
root.data([1, 2, 3]).append(cm.circle, {
  x: (d) => d * 50,
  y: 50,
  r: (d) => d * 8,
  fill: "steelblue",
});
```

## _flow_.process(_process[, ...params]_) {#flow-process}

Processes the data of this flow with the specified [_process_](/process) function and _params_, and returns a flow with the processed data. Use it to prepare data before [appending](#flow-append) shapes.

```js
root
  .data([1, 2, 3, 4])
  .process(cm.filter, (d) => d % 2 === 0)
  .append(cm.circle, {x: (d) => d * 40, y: 50, r: 10});
```

See [Charming Process](/process) for the built-in process functions.

## _flow_.transform(_transform[, ...params]_) {#flow-transform}

Transforms the attribute values of the shapes just appended with the specified [_transform_](/transform) function and _params_, and returns a new flow. Use it to derive final values after [appending](#flow-append), for example to map abstract values to positions on the canvas:

```js eval code=false
(() => {
  const renderer = cm.canvas({width: 640, height: 160});
  const root = cm.flow().renderer(renderer);

  root
    .data(Array.from({length: 50}, (_, i) => (i / 50) * Math.PI * 2))
    .append(cm.circle, {
      x: (d) => d,
      y: (d) => Math.sin(d),
      r: 10,
      fill: "rgba(175, 175, 175, 0.5)",
      stroke: "black",
    })
    .transform(cm.mapPosition, {padding: 20});

  root.render();

  return renderer.node();
})();
```

```js
root
  .data(Array.from({length: 50}, (_, i) => (i / 50) * Math.PI * 2))
  .append(cm.circle, {
    x: (d) => d,
    y: (d) => Math.sin(d),
    r: 10,
    fill: "rgba(175, 175, 175, 0.5)",
    stroke: "black",
  })
  .transform(cm.mapPosition, {padding: 20});
```

See [Charming Transform](/transform) for the built-in transforms.

## _flow_.call(_callback[, ...params]_) {#flow-call}

Calls the specified _callback_ with this flow and _params_, and returns this flow. Use it to reuse a piece of a drawing.

```js
function scaleRadius(flow) {
  flow.transform(cm.mapAttrs, {r: {range: [10, 15]}});
}

root
  .data([1, 2, 3, 4])
  .append(cm.circle, {x: (d) => d * 40, y: 50, r: (d) => d})
  .call(scaleRadius);
```

## _cm_.canvas(_[options]_) {#cm-canvas}

Returns a renderer that draws with the [Canvas 2D API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API).

Options:

- **width** — CSS width of the canvas (default `640`).
- **height** — CSS height (default `480`).
- **dpi** — pixel ratio of the backing store (default `window.devicePixelRatio`).

Use _renderer_.node() to get the canvas element.

```js
const renderer = cm.canvas({width: 200, height: 100});

document.body.append(renderer.node());
```

For many shapes, use [_cm_.webgl](/webgl#cm-webgl). For ASCII art, use [_cm_.terminal](/terminal#cm-terminal).

## Animating

Charming doesn't run an animation loop for you: draw each frame yourself, for example with [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame). Keep the state in your own variables and data, update it, append the frame's shapes and render.

```js eval code=false
(() => {
  const renderer = cm.canvas({width: 640, height: 160});
  const root = cm.flow().renderer(renderer);
  const node = renderer.node();
  let x = 0;
  let frame = requestAnimationFrame(function tick() {
    if (!node.isConnected && x > 0) return;
    x = (x + 2) % 640;
    root.append(cm.clear, {fill: "white"});
    root.append(cm.circle, {x, y: 80, r: 30, fill: "black"});

    root.render();
    frame = requestAnimationFrame(tick);
  });
  unsubscribe(() => cancelAnimationFrame(frame));

  return node;
})();
```

```js
const renderer = cm.canvas({width: 640, height: 160});
const root = cm.flow().renderer(renderer);
let x = 0;

requestAnimationFrame(function frame() {
  x = (x + 2) % 640;
  root.append(cm.clear, {fill: "white"});
  root.append(cm.circle, {x, y: 80, r: 30, fill: "black"});

  root.render();
  requestAnimationFrame(frame);
});

document.body.append(renderer.node());
```
