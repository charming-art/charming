import {group as groupBy, max, mean, median, min, range, sum} from "d3-array";

// Like Plot's reducers: each takes the index of a group's rows and the values of the input channel.
const reducers = {
  count: (I) => I.length,
  sum: (I, V) => sum(I, (i) => V[i]),
  mean: (I, V) => mean(I, (i) => V[i]),
  median: (I, V) => median(I, (i) => V[i]),
  min: (I, V) => min(I, (i) => V[i]),
  max: (I, V) => max(I, (i) => V[i]),
  first: (I, V) => V[I[0]],
  last: (I, V) => V[I[I.length - 1]],
};

// The reducer of an output, by name, case-insensitive, or a function of the values of the group, or
// of its rows if the channel isn't bound.
function reducerOf(reduce) {
  if (typeof reduce === "function") return (I, V, rows) => reduce(I.map((i) => (V ? V[i] : rows[i])));
  const reducer = reducers[`${reduce}`.toLowerCase()];
  if (!reducer) throw new Error(`Unknown reducer: ${reduce}.`);
  return reducer;
}

// The value of a channel at a row: a constant channel has the same value for every row.
function valueAt(V, i) {
  return Array.isArray(V) || ArrayBuffer.isView(V) ? V[i] : V;
}

// The rows of the index in groups, by the values of each channel in turn, in order of first
// appearance. Values are compared as values, so equal dates are one group.
export function groupsOf(I, channels) {
  if (!channels.length) return [I];
  const [V, ...rest] = channels;
  return Array.from(groupBy(I, (i) => valueAt(V, i)).values(), (J) => groupsOf(J, rest)).flat();
}

// The series of a context, the first of z, fill and stroke, unless it's an output, like Plot.
export function seriesKey(value, outputs) {
  return ["z", "fill", "stroke"].find((key) => key in value && !(key in outputs));
}

// Turns the groups of a context into one row each, like Plot's group and bin transforms: the
// channels in keys take the values of the group's first row, each output reduces its input
// channel of the same name, such as {fill: "max"}, and the other channels are dropped. The datum
// of a row is the rows of its group. The hint of an output is its input's, or Frequency for a
// count, like Plot. Extra channels, such as the edges of bins, are added from fields.
export function reduceGroups(context, groups, keys, outputs, fields = {}) {
  const {value, hints = {}, group: rows} = context;
  const newValue = {};
  const newHints = {};
  for (const key of keys) {
    newValue[key] = groups.map((I) => valueAt(value[key], I[0]));
    if (key in hints) newHints[key] = hints[key];
  }
  for (const key in fields) newValue[key] = fields[key];
  for (const key in outputs) {
    const reduce = reducerOf(outputs[key]);
    newValue[key] = groups.map((I) => reduce(I, value[key], rows));
    const count = `${outputs[key]}`.toLowerCase() === "count";
    newHints[key] = count ? {label: "Frequency"} : {...hints[key]};
  }
  for (const key in fields) if (key in hints && !(key in newHints)) newHints[key] = hints[key];
  return {
    ...context,
    I: range(groups.length),
    group: groups.map((I) => I.map((i) => rows[i])),
    value: newValue,
    hints: newHints,
  };
}

// The index of the rows of a context: all of them, unless an earlier transform selected some.
export function indexOf({I, group}) {
  return I ? Array.from(I) : range(group.length);
}
