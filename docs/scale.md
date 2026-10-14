# Charming Scale

**Charming Scale** maps abstract values to visual values. Scales are used by [transforms](/transform) and can be called directly. A scale is a function, so any function that maps a value works where a scale is expected, including [d3-scale](https://d3js.org/d3-scale) scales.

```js
const x = cm.scaleLinear([0, 10], [0, 100]);
x(5); // 50
```

## _cm_.scaleLinear(_domain[, range[, options]]_) {#cm-scale-linear}

Returns a linear scale that maps the continuous _domain_ to the continuous _range_ (default `[0, 1]`). Values outside the domain are extrapolated. Options:

- **unknown** — the output for `null` and `NaN` inputs (default `undefined`).
- **interpolate** — a function that maps a normalized value between 0 and 1 to an output, used instead of the range.

```js
const scale = cm.scaleLinear([0, 1], [0, 100]);
scale(0); // 0
scale(0.5); // 50
scale(1); // 100
```

## _cm_.scaleSqrt(_domain[, range[, options]]_) {#cm-scale-sqrt}

Like [_cm_.scaleLinear](#cm-scale-linear), but applies a square root to the input first.

```js
const scale = cm.scaleSqrt([0, 1], [0, 100]);
scale(0.09); // 30
scale(0.64); // 80
scale(0.81); // 90
```

## _cm_.scaleLog(_domain[, range[, options]]_) {#cm-scale-log}

Like [_cm_.scaleLinear](#cm-scale-linear), but applies a logarithm to the input first.

```js
const scale = cm.scaleLog([1, 10], [0, 1]);
scale(Math.sqrt(10)); // 0.5
```

## _cm_.scaleOrdinal(_domain, range[, options]_) {#cm-scale-ordinal}

Returns an ordinal scale that maps each value of the discrete _domain_ to the value of _range_ at the same index. The range repeats if it's shorter than the domain. Options:

- **unknown** — the output for values not in the domain (default `undefined`).

```js
const scale = cm.scaleOrdinal(["A", "B", "C"], ["steelblue", "yellow", "red"]);
scale("A"); // "steelblue"
scale("B"); // "yellow"
scale("C"); // "red"
```
