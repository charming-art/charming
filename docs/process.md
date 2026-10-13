# Charming Process

**Charming Process** provides functions for [_flow_.process](/flow#flow-process), which prepare the data of a flow before shapes are appended. Each function is called with the flow, its groups and the parameters passed to _flow_.process, and returns the processed groups. Callbacks are passed the datum (_d_), the index (_i_), the group (_data_) and the flow (_flow_).

```js
const data = [
  {name: "Locke", number: 4},
  {name: "Reyes", number: 8},
  {name: "Ford", number: 15},
  {name: "Jarrah", number: 16},
  {name: "Shephard", number: 23},
  {name: "Kwon", number: 42},
];

root
  .data(data)
  .process(cm.filter, (d) => d.number % 2 === 0)
  .append(cm.circle, {x: (d) => d.number * 10, y: 50, r: 10});
```

Any function with the same signature works as a process function too.

## _cm_.each {#cm-each}

Calls the callback for each datum, and keeps the data.

```js
root.data(particles).process(cm.each, (d) => d.location.add(d.velocity));
```

## _cm_.eachRight {#cm-each-right}

Like [_cm_.each](#cm-each), but goes from the last datum to the first, so the callback can remove data while iterating.

```js
root.data(particles).process(cm.eachRight, (d, i, data) => {
  if (d.lifespan < 0) data.splice(i, 1);
});
```

## _cm_.filter {#cm-filter}

Keeps the data for which the callback returns true.

```js
root.data(data).process(cm.filter, (d) => d.number % 2 === 0);
```

## _cm_.map {#cm-map}

Replaces each datum with the value the callback returns.

```js
root.data(data).process(cm.map, (d) => ({...d, number: d.number * 2}));
```

## _cm_.push {#cm-push}

Appends the specified value to each group. If the value is a function, it's called for each group, being passed the group (_data_), the index (_i_), the groups (_groups_) and the flow (_flow_), and its return value is appended.

```js
root.data(particles).process(cm.push, () => createParticle());
```

## _cm_.derive {#cm-derive}

Returns copies of the data with fields derived from the specified object. Each field is a constant, or a function called for each datum.

```js
root.data(data).process(cm.derive, {
  double: (d) => d.number * 2,
  group: "lost",
});
```
