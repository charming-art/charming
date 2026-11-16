// The primitives that shapes draw.
const primitives = ["point", "circle", "rect", "line", "triangle", "path", "polygon", "text", "clear"];

// The channels of the timing of a stage: delay, duration and ease, for updates, and enterDelay or
// exitDuration, for enters and exits.
const timings = ["delay", "duration", "ease"];

// A renderer that records what shapes draw rather than drawing it, for transitions: each primitive
// keeps its type, its attributes and the translations and rotations it's drawn in. While a shape
// of the flow is drawn, between begin and end, its primitives also get their identity, their
// states as they enter and exit, and their timing, from the channels of their rows.
export function recorder() {
  const recorded = [];
  const stack = [];
  let ops = [];
  let node = null;
  let start = 0;
  const renderer = {
    recorded,
    save: () => (stack.push(ops), (ops = ops.slice())),
    restore: () => (ops = stack.pop() ?? []),
    translate: (x, y) => ops.push(["translate", x, y]),
    rotate: (angle) => ops.push(["rotate", angle]),
    begin(meta) {
      node = meta;
      start = recorded.length;
    },
    end() {
      const drawn = recorded.slice(start);
      // A shape that draws a primitive per row, such as a rect, gives each primitive its row; one
      // that draws a primitive per group, such as a line, gives it the first row of the group.
      const perRow = drawn.length === node.I.length;
      drawn.forEach((primitive, n) => Object.assign(primitive, identify(node, perRow ? node.I[n] : null, n)));
      node = null;
    },
  };
  for (const type of primitives) {
    renderer[type] = (attrs) => recorded.push({type, attrs: {...attrs}, ops: ops.slice()});
  }
  return renderer;
}

function identify({path, index, I, value = {}, group}, row, n) {
  const r = row ?? I[0];
  const at = (key) => value[key]?.[r];
  const datum = row === null ? group : group[row];
  return {
    path,
    position: `${index}:${row ?? `g${n}`}`,
    key: at("key"),
    groupKey: at("groupKey"),
    datum: datum !== null && typeof datum === "object" ? datum : undefined,
    enter: stateOf(value, "enter", r),
    exit: stateOf(value, "exit", r),
    timing: {
      update: timingOf(value, "", r),
      enter: timingOf(value, "enter", r),
      exit: timingOf(value, "exit", r),
    },
  };
}

// The attributes of a stage of a row, such as {y: 200} from the channel enterY.
function stateOf(value, stage, r) {
  const state = {};
  for (const key in value) {
    if (!key.startsWith(stage) || key.length === stage.length) continue;
    const name = key[stage.length].toLowerCase() + key.slice(stage.length + 1);
    if (!timings.includes(name)) state[name] = value[key]?.[r];
  }
  return state;
}

function timingOf(value, stage, r) {
  const timing = {};
  for (const name of timings) {
    const key = stage ? stage + name[0].toUpperCase() + name.slice(1) : name;
    if (key in value) timing[name] = value[key]?.[r];
  }
  return timing;
}
