# Falling Grid, toxiclibs.js

A cloth hanging from pins and falling under gravity. [toxiclibs.js](http://haptic-data.com/toxiclibsjs/) simulates a grid of particles connected by springs with Verlet integration, and Charming draws the springs as [links](/shape#cm-link).

```js eval code=false
const replay = Inputs.button("Replay");
```

```js eval t=example
replay;

const {Vec2D} = toxi.geom;
const {VerletPhysics2D, VerletParticle2D, VerletSpring2D} = toxi.physics2d;
const {GravityBehavior} = toxi.physics2d.behaviors;

const width = 640;
const height = 240;
const cols = 65;
const rows = 20;
const w = width / (cols - 1);
const world = new VerletPhysics2D();
world.addBehavior(new GravityBehavior(new Vec2D(0, 1)));

// A row of particles, pinned every four columns at the top.
const particles = Array.from({length: cols * rows}, (_, i) => {
  const particle = new VerletParticle2D((i % cols) * w, 0);
  if ((i % cols) % 4 === 0 && i < cols) particle.lock();
  world.addParticle(particle);
  return particle;
});

// Springs to the right and below neighbors.
const springs = particles.flatMap((particle, i) => {
  const neighbors = [];
  if (i % cols !== cols - 1) neighbors.push(particles[i + 1]);
  if (i + cols < particles.length) neighbors.push(particles[i + cols]);
  return neighbors.map((neighbor) => {
    const spring = new VerletSpring2D(particle, neighbor, w, 0.25);
    world.addSpring(spring);
    return spring;
  });
});

const renderer = cm.canvas({width, height});
const root = cm.flow().renderer(renderer);

requestAnimationFrame(function frame() {
  world.update();
  root.append(cm.clear, {fill: "white"});
  root.data(springs).append(cm.link, {
    x: (d) => d.a.x,
    y: (d) => d.a.y,
    x1: (d) => d.b.x,
    y1: (d) => d.b.y,
    stroke: "black",
    strokeWidth: 2,
  });

  root.render();
  requestAnimationFrame(frame);
});

document.body.append(renderer.node());
```
