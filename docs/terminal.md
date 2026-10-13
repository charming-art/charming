# Charming Terminal

**Charming Terminal** renders shapes as ASCII art, in a terminal-like grid drawn on a canvas. Shapes are positioned in **cells** instead of pixels, and colored with [cells](#cells) — a character with a foreground and a background color — instead of plain colors. The grid is computed by a software rasterizer written in Rust and compiled to WebAssembly.

```js eval code=false
(() => {
  const renderer = cm.terminal({cols: 30, rows: 24, mode: "double"});
  const root = cm.flow().renderer(renderer);

  root
    .data(Array.from({length: 240}, (_, i) => (i / 240) * Math.PI * 2))
    .append(cm.group, {x: 15, y: 12})
    .append(cm.point, {
      x: (t) => 10 * Math.cos(t) * Math.cos(t * 3),
      y: (t) => 10 * Math.sin(t) * Math.cos(t * 3),
      stroke: {ch: "🌟", wide: true},
    });

  root.render();

  return renderer.node();
})();
```

```js
const renderer = cm.terminal({cols: 30, rows: 24, mode: "double"});
const root = cm.flow().renderer(renderer);

root
  .data(Array.from({length: 240}, (_, i) => (i / 240) * Math.PI * 2))
  .append(cm.group, {x: 15, y: 12})
  .append(cm.point, {
    x: (t) => 10 * Math.cos(t) * Math.cos(t * 3),
    y: (t) => 10 * Math.sin(t) * Math.cos(t * 3),
    stroke: {ch: "🌟", wide: true},
  });

root.render();

document.body.append(renderer.node());
```

## _cm_.terminal(_[options]_) {#cm-terminal}

Returns a renderer that draws a terminal. Options:

- **cols**, **rows** — the size of the grid in cells. If not specified, they're computed from **width** and **height**.
- **width**, **height** — the size in pixels used to compute the grid (default `640` and `480`).
- **mode** — `"single"` (default) or `"double"`. In double mode, each cell is two characters wide, so wide characters such as emoji and CJK line up. A normal character is drawn twice to fill the cell.
- **fontFamily** — the font of the cells (default `"courier-new, courier, monospace"`).
- **fontSize** — the font size in pixels (default `15`).
- **fontWeight** — the font weight (default `"normal"`).

```js
const renderer = cm.terminal({cols: 80, rows: 24});

document.body.append(renderer.node());
```

Positions and sizes are in cells: `x: 1` is the second column. [_cm_.mapPosition](/transform#cm-map-position) maps to the grid.

The terminal renderer draws [point](/shape#cm-point), [link](/shape#cm-link), [rect](/shape#cm-rect), [text](/shape#cm-text), [figlet](#cm-figlet), [clear](/shape#cm-clear) and [group](/shape#cm-group).

## Cells

A cell is an object with these fields:

- **ch** — the character (default `" "`).
- **fg** — the color of the character (default `"#fff"`).
- **bg** — the background color of the cell (default none).
- **wide** — whether the character is double-width, such as an emoji or a CJK character (default `false`). Use it with `mode: "double"`.

Cells are used where colors are used with other renderers: **stroke** for points, links and rect outlines, and **fill** for rects. A point's **stroke0**, **stroke1** and **stroke2** set its character, foreground and background separately.

```js eval code=false
(() => {
  const renderer = cm.terminal({cols: 40, rows: 10});
  const root = cm.flow().renderer(renderer);

  root.append(cm.rect, {x: 1, y: 1, width: 12, height: 6, fill: {ch: "#", fg: "orange"}});
  root.append(cm.rect, {x: 15, y: 1, width: 12, height: 6, stroke: {ch: "+", fg: "steelblue"}});
  root.append(cm.link, {x: 29, y: 1, x1: 38, y1: 6, stroke: {ch: "*", fg: "seagreen"}});
  root.append(cm.point, {x: 1, y: 8, stroke0: "@", stroke1: "black", stroke2: "yellow"});

  root.render();

  return renderer.node();
})();
```

```js
root.append(cm.rect, {x: 1, y: 1, width: 12, height: 6, fill: {ch: "#", fg: "orange"}});
root.append(cm.rect, {x: 15, y: 1, width: 12, height: 6, stroke: {ch: "+", fg: "steelblue"}});
root.append(cm.link, {x: 29, y: 1, x1: 38, y1: 6, stroke: {ch: "*", fg: "seagreen"}});
root.append(cm.point, {x: 1, y: 8, stroke0: "@", stroke1: "black", stroke2: "yellow"});
```

On the terminal, [text](/shape#cm-text) draws one character per cell. Its **fill** is the color of the characters.

## _cm_.figlet {#cm-figlet}

Appends text drawn as an ASCII-art banner with [figlet](https://github.com/patorjk/figlet.js). It's a shape for the terminal renderer only. It supports:

- **text** — the text.
- **x**, **y** — the position, in cells.
- **fill** — the color of the characters.
- **textAlign** — `"start"` (default), `"center"` or `"end"`.
- **textBaseline** — `"top"` (default), `"middle"` or `"bottom"`.
- **fontFamily** — the figlet font: `"standard"` (default) or `"ghost"`.

```js eval code=false
(() => {
  const renderer = cm.terminal({cols: 60, rows: 11});
  const root = cm.flow().renderer(renderer);

  root.append(cm.figlet, {
    text: "hello",
    x: 30,
    y: 5,
    textAlign: "center",
    textBaseline: "middle",
    fontFamily: "ghost",
    fill: () => (x, y, width) => `hsl(${(x / width) * 360}, 90%, 65%)`,
  });

  root.render();

  return renderer.node();
})();
```

```js
const renderer = cm.terminal({cols: 60, rows: 11});
const root = cm.flow().renderer(renderer);

root.append(cm.figlet, {
  text: "hello",
  x: 30,
  y: 5,
  textAlign: "center",
  textBaseline: "middle",
  fontFamily: "ghost",
  fill: () => (x, y, width) => `hsl(${(x / width) * 360}, 90%, 65%)`,
});

root.render();
```

The **fill** of text and figlet can be a function, called for each character with its column (_x_), row (_y_), and the _width_ and _height_ of the text. It colors the characters individually, for example as a gradient. Because [options that are functions](/flow#flow-append) are evaluated per datum, the function is returned from an accessor: `fill: () => (x, y, width) => color`. A [d3-scale-chromatic](https://d3js.org/d3-scale-chromatic) interpolator works well: `fill: () => (x, y, width) => d3.interpolateSinebow(x / width)`.

## Animating

Draw frames as with any [renderer](/flow#animating). Here is a fire of characters:

```js eval code=false
(() => {
  const cols = 70;
  const rows = 24;
  const chars = " .:-=+*#%@";
  const fire = Array.from({length: rows}, () => new Array(cols).fill(0));
  const renderer = cm.terminal({cols, rows});
  const root = cm.flow().renderer(renderer);
  const node = renderer.node();

  function update() {
    for (let y = 0; y < rows - 1; y++) {
      for (let x = 0; x < cols; x++) {
        const spread = Math.round(Math.random() * 2 - 1);
        const source = fire[y + 1][Math.min(Math.max(0, x - spread), cols - 1)];
        fire[y][x] = Math.max(0, source - Math.floor(Math.random() * 3));
      }
    }
    for (let x = 0; x < cols; x++) fire[rows - 1][x] = Math.floor(Math.random() * rows);
  }

  let tick = 0;
  let frame = requestAnimationFrame(function animate() {
    if (!node.isConnected && tick > 0) return;
    if (tick++ % 4 === 0) {
      update();
      root.append(cm.clear, {fill: "black"});
      root
        .data(fire)
        .append(cm.group, {x: 0, y: (_, i) => i})
        .data((row) => row)
        .append(cm.point, {
          x: (_, i) => i,
          y: 0,
          stroke: (heat) => {
            if (heat === 0) return null;
            const t = heat / rows;
            return {
              ch: chars[Math.min(chars.length - 1, Math.floor(t * chars.length))],
              fg: `hsl(${t * 60}, 100%, ${30 + t * 50}%)`,
            };
          },
        });

      root.render();
    }
    frame = requestAnimationFrame(animate);
  });
  unsubscribe(() => cancelAnimationFrame(frame));

  return node;
})();
```

```js
const cols = 70;
const rows = 24;
const chars = " .:-=+*#%@";
const fire = Array.from({length: rows}, () => new Array(cols).fill(0));
const renderer = cm.terminal({cols, rows});
const root = cm.flow().renderer(renderer);

// Each cell takes the heat of a random cell below it, minus a random decay.
function update() {
  for (let y = 0; y < rows - 1; y++) {
    for (let x = 0; x < cols; x++) {
      const spread = Math.round(Math.random() * 2 - 1);
      const source = fire[y + 1][Math.min(Math.max(0, x - spread), cols - 1)];
      fire[y][x] = Math.max(0, source - Math.floor(Math.random() * 3));
    }
  }
  for (let x = 0; x < cols; x++) fire[rows - 1][x] = Math.floor(Math.random() * rows);
}

function draw() {
  root.append(cm.clear, {fill: "black"});
  root
    .data(fire)
    .append(cm.group, {x: 0, y: (_, i) => i})
    .data((row) => row)
    .append(cm.point, {
      x: (_, i) => i,
      y: 0,
      stroke: (heat) => {
        if (heat === 0) return null;
        const t = heat / rows;
        const ch = chars[Math.min(chars.length - 1, Math.floor(t * chars.length))];
        return {ch, fg: `hsl(${t * 60}, 100%, ${30 + t * 50}%)`};
      },
    });

  root.render();
}

setInterval(() => {
  update();
  draw();
}, 1000 / 15);

document.body.append(renderer.node());
```
