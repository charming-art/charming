# Many-Body Force

A simple many-body simulation: every pair of circles attracts or repels depending on their distance, so they settle into a wobbly swarm. Drag a circle to disturb it. The circles are SVG made with [_cm_.svg](/dom#cm-svg) and updated with [_cm_.attr](/dom#cm-attr). Inspired by Konstantin Makhmutov's [Wobbly Swarm](https://openprocessing.org/sketch/492096), [d3-force](https://d3js.org/d3-force) and Daniel Shiffman's [Two Body Attraction](https://editor.p5js.org/natureofcode/sketches/cmj37xPCM).

```js eval code=false
const n = Inputs.range([0, 150], {label: "Circle count", step: 1, value: 100});
```

```js eval t=example
const size = 640;
const radius = 20 * Math.sqrt(n);
const bodies = Array.from({length: n}, () => ({
  position: cm.vec(Math.random() * size, Math.random() * size),
  velocity: cm.vec(),
  mass: 12 / 50,
}));
let selected = null;

function attract(a, b) {
  const force = cm.vecSub(b.position, a.position);
  const d = Math.max(1, force.mag());
  force.mag(a.mass * b.mass * ((d - radius) / d));
  a.velocity.mult(0.99).add(force.div(a.mass));
}

function tick() {
  for (const a of bodies) for (const b of bodies) if (a !== b) attract(a, b);
  for (const body of bodies) if (body !== selected) body.position.add(body.velocity);
}

const svg = cm.svg`<svg ${{width: size, height: size, style_touch_action: "none"}}>
  <circle ${{
    data: bodies,
    r: 12,
    fill: "black",
    style_cursor: "pointer",
    onpointerdown: (event, node, d) => (selected = d),
  }}/>
</svg>`;
const circles = svg.querySelectorAll("circle");

svg.addEventListener("pointermove", (event) => selected && selected.position.set(event.offsetX, event.offsetY));
window.addEventListener("pointerup", () => (selected = null));

requestAnimationFrame(function frame() {
  tick();
  bodies.forEach((d, i) => {
    cm.attr(circles[i], "cx", d.position.x);
    cm.attr(circles[i], "cy", d.position.y);
    cm.attr(circles[i], "fill", d === selected ? "red" : "black");
  });
  requestAnimationFrame(frame);
});

document.body.append(svg);
```
