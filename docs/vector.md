# Charming Vector

**Charming Vector** provides 2D vectors for simulating physical laws, such as positions, velocities and forces. Each operation comes in two forms: a function such as _cm_.vecAdd(_a_, _b_), which returns a new vector, and a method such as _vec_.add(_b_), which changes the vector in place and returns it.

```js eval code=false
(() => {
  const renderer = cm.canvas({width: 640, height: 200});
  const root = cm.flow().renderer(renderer);
  const node = renderer.node();
  const mover = {location: cm.vec(320, 50), velocity: cm.vec(3, 0)};
  const gravity = cm.vec(0, 0.3);
  let started = false;
  let frame = requestAnimationFrame(function tick() {
    if (!node.isConnected && started) return;
    started = true;
    mover.velocity.add(gravity);
    mover.location.add(mover.velocity);
    if (mover.location.y > 180) mover.velocity.setY(-Math.abs(mover.velocity.y) * 0.95);
    if (mover.location.x < 20 || mover.location.x > 620) mover.velocity.setX(-mover.velocity.x);
    root.append(cm.clear, {fill: "white"});
    root.datum(mover).append(cm.circle, {x: (d) => d.location.x, y: (d) => d.location.y, r: 20, fill: "black"});

    root.render();
    frame = requestAnimationFrame(tick);
  });
  unsubscribe(() => cancelAnimationFrame(frame));

  return node;
})();
```

```js
const mover = {location: cm.vec(320, 50), velocity: cm.vec(3, 0)};
const gravity = cm.vec(0, 0.3);

requestAnimationFrame(function frame() {
  mover.velocity.add(gravity);
  mover.location.add(mover.velocity);
  if (mover.location.y > 180) mover.velocity.setY(-Math.abs(mover.velocity.y) * 0.95);
  if (mover.location.x < 20 || mover.location.x > 620) mover.velocity.setX(-mover.velocity.x);
  root.append(cm.clear, {fill: "white"});
  root.datum(mover).append(cm.circle, {x: (d) => d.location.x, y: (d) => d.location.y, r: 20, fill: "black"});

  root.render();
  requestAnimationFrame(frame);
});
```

## _cm_.vec(_[x[, y]]_) {#cm-vec}

Returns a vector with the specified _x_ and _y_ components, each defaulting to `0`.

```js
cm.vec(); // {x: 0, y: 0}
cm.vec(1); // {x: 1, y: 0}
cm.vec(2, 3); // {x: 2, y: 3}
```

## _cm_.vecFromAngle(_angle_) {#cm-vec-from-angle}

Returns the unit vector at the specified _angle_ in radians.

```js
cm.vecFromAngle(Math.PI / 4); // {x: 0.7071…, y: 0.7071…}
```

## _cm_.vecRandom() {#cm-vec-random}

Returns a unit vector in a random direction.

```js
cm.vecRandom().mag(); // 1
```

## _cm_.vecAdd(_a_, _b_) {#cm-vec-add}

Returns the sum of the vectors _a_ and _b_.

```js
cm.vecAdd(cm.vec(1, 2), cm.vec(2, 3)); // {x: 3, y: 5}
```

## _cm_.vecSub(_a_, _b_) {#cm-vec-sub}

Returns the difference of the vectors _a_ and _b_.

```js
cm.vecSub(cm.vec(1, 2), cm.vec(2, 4)); // {x: -1, y: -2}
```

## _cm_.vecMult(_a_, _value_) {#cm-vec-mult}

Returns the vector _a_ multiplied by _value_.

```js
cm.vecMult(cm.vec(3, 4), 2); // {x: 6, y: 8}
```

## _cm_.vecDiv(_a_, _value_) {#cm-vec-div}

Returns the vector _a_ divided by _value_.

```js
cm.vecDiv(cm.vec(3, 4), 0.5); // {x: 6, y: 8}
```

## _cm_.vecMag(_a[, value]_) {#cm-vec-mag}

With one argument, returns the magnitude of the vector _a_. With two, returns a vector in the direction of _a_ with magnitude _value_.

```js
cm.vecMag(cm.vec(3, 4)); // 5
cm.vecMag(cm.vec(3, 4), 10); // {x: 6, y: 8}
```

## _cm_.vecNorm(_a_) {#cm-vec-norm}

Returns the unit vector in the direction of _a_. The zero vector stays the zero vector.

```js
cm.vecNorm(cm.vec(3, 4)); // {x: 0.6, y: 0.8}
```

## _cm_.vecClamp(_a_, _min[, max]_) {#cm-vec-clamp}

Returns a copy of the vector _a_ with its magnitude constrained to [_min_, _max_]. With two arguments, the second is the maximum and the minimum is `0`.

```js
cm.vecClamp(cm.vec(3, 4), 10, 15); // {x: 6, y: 8}
cm.vecClamp(cm.vec(6, 8), 5); // {x: 3, y: 4}
```

## _cm_.vecDist(_a_, _b_) {#cm-vec-dist}

Returns the distance between the vectors _a_ and _b_.

```js
cm.vecDist(cm.vec(4, 6), cm.vec(1, 2)); // 5
```

## _cm_.vecDist2(_a_, _b_) {#cm-vec-dist2}

Returns the squared distance between the vectors _a_ and _b_, which is cheaper to compute when only comparing distances.

```js
cm.vecDist2(cm.vec(4, 6), cm.vec(1, 2)); // 25
```

## _cm_.vecDot(_a_, _b_) {#cm-vec-dot}

Returns the dot product of the vectors _a_ and _b_.

```js
cm.vecDot(cm.vec(3, 4), cm.vec(1, 2)); // 11
```

## _cm_.vecCross(_a_, _b_) {#cm-vec-cross}

Returns the cross product of the vectors _a_ and _b_: the z component of their 3D cross product.

```js
cm.vecCross(cm.vec(3, 4), cm.vec(1, 2)); // 2
```

## _cm_.vecAngle(_a_) {#cm-vec-angle}

Returns the angle of the vector _a_ in radians.

```js
cm.vecAngle(cm.vec(1, 1)); // Math.PI / 4
```

## _vec_.set(_x[, y]_) {#vec-set}

Sets the components to those of the vector _x_, or to the numbers _x_ and _y_, and returns this vector. _vec_.setX(_x_) and _vec_.setY(_y_) set one component.

```js
const a = cm.vec(1, 2);
a.set(cm.vec(3, 4)); // a, {x: 3, y: 4}
a.set(5, 6); // a, {x: 5, y: 6}
a.setX(7); // a, {x: 7, y: 6}
```

## _vec_.clone() {#vec-clone}

Returns a copy of this vector.

```js
const a = cm.vec(1, 2);
const b = a.clone();
a === b; // false
```

## _vec_.add(_b_) {#vec-add}

Adds the vector _b_ to this vector, and returns this vector. Likewise, _vec_.sub(_b_) subtracts, _vec_.mult(_value_) multiplies and _vec_.div(_value_) divides.

```js
const a = cm.vec(1, 2);
a.add(cm.vec(3, 4)); // a, {x: 4, y: 6}
a.mult(2); // a, {x: 8, y: 12}
```

## _vec_.mag(_[value]_) {#vec-mag}

Without an argument, returns the magnitude of this vector. With a _value_, sets the magnitude and returns this vector.

```js
const a = cm.vec(3, 4);
a.mag(); // 5
a.mag(10); // a, {x: 6, y: 8}
```

## _vec_.norm() {#vec-norm}

Normalizes this vector to magnitude 1, and returns it.

```js
cm.vec(3, 4).norm(); // {x: 0.6, y: 0.8}
```

## _vec_.clamp(_min[, max]_) {#vec-clamp}

Constrains the magnitude of this vector to [_min_, _max_], and returns it. With one argument, it's the maximum and the minimum is `0`.

```js
cm.vec(6, 8).clamp(5); // {x: 3, y: 4}
```

## _vec_.random() {#vec-random}

Sets this vector to a unit vector in a random direction, and returns it.

```js
cm.vec(3, 4).random().mag(); // 1
```

## _vec_.dist(_b_) {#vec-dist}

Returns the distance to the vector _b_. _vec_.dist2(_b_) returns the squared distance.

```js
cm.vec(4, 6).dist(cm.vec(1, 2)); // 5
cm.vec(4, 6).dist2(cm.vec(1, 2)); // 25
```

## _vec_.dot(_b_) {#vec-dot}

Returns the dot product with the vector _b_. _vec_.cross(_b_) returns the cross product.

```js
cm.vec(3, 4).dot(cm.vec(1, 2)); // 11
cm.vec(3, 4).cross(cm.vec(1, 2)); // 2
```

## _vec_.angle() {#vec-angle}

Returns the angle of this vector in radians.

```js
cm.vec(1, 1).angle(); // Math.PI / 4
```
