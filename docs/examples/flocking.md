# Flocking

_Green Growth_: drag on the canvas to spawn particles that wander along [noise](/noise), shrink and die, leaving organic strokes. Made for [Genuary 2024](https://genuary.art/prompts#jan19), "Flocking". A reimplementation of Elisabeth's [Blue Growth](https://openprocessing.org/sketch/178381), itself inspired by [Raven Kwok](https://www.flickr.com/photos/ravenkwok).

```js eval code=false
const clear = Inputs.button("Clear");
```

```js eval t=example
clear;

const width = 640;
const height = 640;
const noise = cm.noise();
const particles = [];
const random = (a, b) => a + Math.random() * (b - a);
const renderer = cm.canvas({width, height});
const root = cm.flow().renderer(renderer);
const node = renderer.node();
let pressed = false;
let init = true;
let mouse = cm.vec();
let frameCount = 0;

node.style.touchAction = "none";
node.addEventListener("pointerdown", (event) => {
  if (init) root.append(cm.clear, {fill: "white"});
  init = false;
  pressed = true;
  mouse = cm.vec(event.offsetX, event.offsetY);
});
node.addEventListener("pointermove", (event) => (mouse = cm.vec(event.offsetX, event.offsetY)));
window.addEventListener("pointerup", () => (pressed = false));

root.append(cm.clear, {fill: "#eee"});
root.append(cm.text, {
  text: "Drag and Draw.",
  x: width / 2,
  y: height / 2,
  fill: "black",
  textAlign: "center",
  textBaseline: "middle",
  fontSize: 50,
  fontFamily: "serif",
});

function createParticle(i) {
  return {
    loc: mouse.clone(),
    acc: cm.vec(),
    vel: cm.vecFromAngle(random(0, Math.PI * 2)).mult(random(0, 5)),
    lifespan: Math.floor(random(30, 90)),
    decay: random(0.75, 0.9),
    weight: random(3, 50),
    age: 0,
    fill: d3.interpolateCool(Math.random()),
    i: particles.length + i,
  };
}

function move(d) {
  const t = frameCount;
  const head = noise((d.loc.x + t + d.i) * 0.01, (d.loc.y + d.i) * 0.01);
  const angle = (head - 0.5) * Math.PI * 4;
  const mag = noise((d.loc.y + t) * 0.01, (d.loc.x + t) * 0.01);
  d.acc.add(cm.vecFromAngle(angle).mult(mag)).add(cm.vecFromAngle(random(0, Math.PI * 2)).mult(0.5));
  d.vel.add(d.acc).mult(d.decay).clamp(3);
  d.loc.add(d.vel);
  d.acc.set(0, 0);
  d.age++;
}

requestAnimationFrame(function frame() {
  frameCount++;
  if (pressed) particles.push(...Array.from({length: 10}, (_, i) => createParticle(i)));
  root
    .data(particles)
    .process(cm.each, move)
    .process(cm.eachRight, (d, i, data) => d.age > d.lifespan && data.splice(i, 1))
    .process(cm.derive, {t: (d) => (d.lifespan - d.age) / d.lifespan})
    .append(cm.circle, {
      x: (d) => d.loc.x,
      y: (d) => d.loc.y,
      r: (d) => d.weight * d.t * 0.5,
      fill: (d) => d.fill,
      stroke: "black",
      strokeWidth: 1.5,
      strokeOpacity: (d) => d.t * 0.25 + 0.2,
    });

  root.render();
  requestAnimationFrame(frame);
});

document.body.append(node);
```
