import * as cm from "./_cm.js";

export function applyForce(d, i, data, app, force, ...rest) {
  const callback = typeof force === "function" ? force : () => force;
  const f = callback(d, i, data, app, ...rest);
  if (f === undefined || f === null) return;
  const a = cm.vecDiv(f, d.mass);
  d.acceleration.add(a);
}

export function updateLocation(d) {
  d.velocity.add(d.acceleration);
  d.location.add(d.velocity);
  d.acceleration.mult(0);
}

export function attraction(d, i, index, app, attractor) {
  const { mass, G } = attractor;
  const force = cm.vecSub(attractor.location, d.location);
  const dist = cm.vecClamp(force, 5, 25).mag();
  const strength = (G * mass * d.mass) / (dist * dist);
  return cm.vecMag(force, strength);
}

export function collisionX(d, i, data, app) {
  if (!d.location.inX(app.width())) {
    d.location.clampX(app.width());
    d.velocity.negX();
  }
}

export function collisionY(d, i, data, app) {
  if (d.location.y > app.height()) {
    d.velocity.negY();
    d.location.y = app.height();
  }
}
