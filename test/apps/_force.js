import * as cm from "./_cm.js";

export function object(options) {
  return {
    location: cm.vec(),
    velocity: cm.vec(),
    acceleration: cm.vec(),
    mass: 1,
    ...options,
  };
}

export function force(d) {
  const callback = typeof d === "function" ? d : () => d;
  return (d, context) => {
    const f = callback(d, context);
    if (f === null || f === undefined) return;
    const a = cm.vecDiv(f, d.mass);
    d.acceleration.add(a);
  };
}

export function attraction(attractor) {
  const { mass, G } = attractor;
  return (d) => {
    const dir = cm.vecSub(attractor.location, d.location);
    const dist = cm.vecClamp(dir, 5, 25).mag();
    const strength = (G * mass * d.mass) / (dist * dist);
    const f = cm.vecMag(dir, strength);
    const apply = force(f);
    apply(d);
  };
}

export function location() {
  return (d) => {
    d.velocity.add(d.acceleration);
    d.location.add(d.velocity);
    d.acceleration.mult(0);
  };
}

export function collisionX() {
  return (d, { app }) => {
    if (!d.location.inX(app.width())) {
      d.location.clampX(app.width());
      d.velocity.negX();
    }
  };
}

export function collisionY() {
  return (d, { app }) => {
    if (d.location.y > app.height()) {
      d.velocity.negY();
      d.location.y = app.height();
    }
  };
}

export function collision() {
  const x = collisionX();
  const y = collisionY();
  return (d, context) => {
    x(d, context);
    y(d, context);
  };
}
