# Falling Polygons, Matter.js

Polygons falling on two ledges. [Matter.js](https://brm.io/matter-js/) simulates the rigid bodies, and Charming draws their vertices as [polygons](/shape#cm-polygon) and the ledges as rotated [rects](/shape#cm-rect).

```js eval code=false
const replay = Inputs.button("Replay");
```

```js eval t=example
replay;

const width = 640;
const height = 240;
const engine = Matter.Engine.create();
const polygons = [];
const ledges = [
  createLedge(width / 4, height - 5, width / 2 - 50, 10),
  createLedge((3 * width) / 4, height - 50, width / 2 - 50, 10),
];
const renderer = cm.canvas({width, height});
const root = cm.flow().renderer(renderer);

function createLedge(x, y, width, height) {
  const body = Matter.Bodies.rectangle(x, y, width, height, {isStatic: true});
  Matter.Composite.add(engine.world, body);
  return {body, width, height};
}

function createPolygon(x, y) {
  const vertices = [
    {x: -10, y: -10},
    {x: 20, y: -15},
    {x: 15, y: 0},
    {x: 0, y: 10},
    {x: -20, y: 15},
  ];
  const body = Matter.Bodies.fromVertices(x, y, vertices, {restitution: 0.2});
  Matter.Body.setVelocity(body, {x: Math.random() * 10 - 5, y: 0});
  Matter.Body.setAngularVelocity(body, 0.1);
  Matter.Composite.add(engine.world, body);
  return {body};
}

// Remove the polygons that fell off the canvas.
function removeFallen(d, i, data) {
  if (d.body.bounds.min.y < height) return;
  data.splice(i, 1);
  Matter.Composite.remove(engine.world, d.body);
}

requestAnimationFrame(function frame() {
  if (Math.random() < 0.1) polygons.push(createPolygon(width / 2, 50));
  Matter.Engine.update(engine);

  root.append(cm.clear, {fill: "white"});
  root
    .data(polygons)
    .process(cm.eachRight, removeFallen)
    .append(cm.polygon, {
      x: (d) => d.body.vertices.map((v) => v.x),
      y: (d) => d.body.vertices.map((v) => v.y),
      fill: "rgb(127, 127, 127)",
      stroke: "black",
      strokeWidth: 2,
    });
  root.data(ledges).append(cm.rect, {
    x: (d) => d.body.position.x,
    y: (d) => d.body.position.y,
    width: (d) => d.width,
    height: (d) => d.height,
    rotate: (d) => d.body.angle,
    anchor: "center",
    fill: "rgb(127, 127, 127)",
    stroke: "black",
    strokeWidth: 2,
  });

  root.render();
  requestAnimationFrame(frame);
});

document.body.append(renderer.node());
```
