# Clusters

Particle systems: each frame, every cluster emits a particle, and particles fade out and are removed with [_cm_.eachRight](/process#cm-each-right). Click the canvas to add a cluster.

```js eval code=false
const replay = Inputs.button("Replay");
```

```js eval t=example
replay;

const width = 640;
const height = 200;
const clusters = [{origin: cm.vec(width / 2, 50), particles: []}];
const renderer = cm.canvas({width, height});
const root = cm.flow().renderer(renderer);
const node = renderer.node();

node.style.border = "solid black 1px";
node.addEventListener("pointerdown", (event) => {
  clusters.push({origin: cm.vec(event.offsetX, event.offsetY), particles: []});
});

function updateParticles(flow) {
  flow
    .process(cm.push, () => ({
      location: cm.vec(0, 0),
      velocity: cm.vec(Math.random() * 2 - 1, Math.random() * -2),
      acceleration: cm.vec(0, 0.05),
      lifespan: 255,
    }))
    .process(cm.eachRight, (d, i, data) => d.lifespan < 0 && data.splice(i, 1))
    .process(cm.each, (d) => {
      d.lifespan -= 2;
      d.velocity.add(d.acceleration);
      d.location.add(d.velocity);
    });
}

function drawParticles(flow) {
  flow
    .append(cm.circle, {
      x: (d) => d.location.x,
      y: (d) => d.location.y,
      r: 5,
      fill: "black",
      stroke: "black",
      fillOpacity: (d) => d.lifespan,
      strokeOpacity: (d) => d.lifespan,
    })
    .transform(cm.mapAttrs, {
      fillOpacity: {domain: [0, 255], range: [0, 0.6]},
      strokeOpacity: {domain: [0, 255], range: [0, 1]},
    });
}

requestAnimationFrame(function frame() {
  root.append(cm.clear, {fill: "white"});
  root
    .data(clusters)
    .append(cm.group, {x: (d) => d.origin.x, y: (d) => d.origin.y})
    .data((d) => d.particles)
    .call(updateParticles)
    .call(drawParticles);

  root.render();
  requestAnimationFrame(frame);
});

document.body.append(node);
```
