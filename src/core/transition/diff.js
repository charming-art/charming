import {easeOf, interpolateAttrs, interpolateOps} from "./interpolate.js";

// A mark fades in and out unless it gives its own states.
const fade = {fillOpacity: 0, strokeOpacity: 0};

// The items that animate from the primitives shown, prev, to the primitives drawn, next. A drawn
// primitive matches a shown one by its key, else by its datum, else by its position in the flow,
// within the same shape of the flow, and then updates; keyed primitives only match by key. One that doesn't match may split from a
// shown primitive whose key is its group key; a shown one that doesn't match may merge into a drawn
// primitive whose key is its group key. The others enter or exit.
export function diff(prev, next, options) {
  const m = prev.length;
  const n = next.length;
  const used = new Set();
  const byKey = new Map();
  const byDatum = new Map();
  const byPosition = new Map();
  const keyed = new Map();
  for (let i = 0; i < m; i++) {
    const {path, key, datum, position} = prev[i];
    if (key !== undefined) {
      byKey.set(`${path}\0${key}`, i);
      if (!keyed.has(key)) keyed.set(key, i);
    } else {
      // A keyed primitive only matches by its key.
      byPosition.set(`${path}\0${position}`, i);
    }
    if (datum) {
      if (!byDatum.has(path)) byDatum.set(path, new Map());
      byDatum.get(path).set(datum, i);
    }
  }

  const take = (i) => {
    if (i === undefined || used.has(i)) return -1;
    used.add(i);
    return i;
  };
  const matches = new Array(n);
  for (let j = 0; j < n; j++) {
    const {path, key, datum, position} = next[j];
    let i = -1;
    if (key !== undefined) i = take(byKey.get(`${path}\0${key}`));
    else {
      if (datum) i = take(byDatum.get(path)?.get(datum));
      if (i < 0) i = take(byPosition.get(`${path}\0${position}`));
    }
    matches[j] = i;
  }

  // Group keys: a drawn primitive splits from the shown one keyed by its group key, and a shown one
  // merges into the drawn one keyed by its group key.
  const nextKeyed = new Map();
  for (let j = 0; j < n; j++) {
    const {key} = next[j];
    if (matches[j] < 0 && key !== undefined && !nextKeyed.has(key)) nextKeyed.set(key, j);
  }
  const merged = new Set();
  const items = [];
  for (let i = 0; i < m; i++) {
    if (used.has(i)) continue;
    const p = prev[i];
    const j = p.groupKey !== undefined ? nextKeyed.get(p.groupKey) : undefined;
    if (j !== undefined) {
      const q = next[j];
      merged.add(j);
      // Merging marks move with the timing of the mark they merge into, from the new frame.
      const to = toward(p.attrs, q.attrs);
      items.push(item(p, "until-end", p.attrs, to, p.ops, opsOf(p, q), timing(q, "update", options)));
    } else if (!splits(next, p, matches)) {
      const exit = {...p.attrs, ...state(p.exit)};
      items.push(item(p, "until-end", p.attrs, exit, p.ops, p.ops, timing(p, "exit", options)));
    }
  }
  for (let j = 0; j < n; j++) {
    const q = next[j];
    const i = matches[j];
    const k = q.groupKey !== undefined ? keyed.get(q.groupKey) : undefined;
    if (i >= 0) {
      const p = prev[i];
      items.push(item(q, "always", p.attrs, q.attrs, p.ops, q.ops, timing(q, "update", options)));
    } else if (merged.has(j)) {
      items.push(item(q, "at-end", q.attrs, q.attrs, q.ops, q.ops, timing(q, "update", options)));
    } else if (k !== undefined && !used.has(k)) {
      const p = prev[k];
      items.push(
        item(q, "always", toward(q.attrs, p.attrs), q.attrs, opsOf(q, p), q.ops, timing(q, "update", options)),
      );
    } else {
      const enter = {...q.attrs, ...state(q.enter)};
      items.push(item(q, "always", enter, q.attrs, q.ops, q.ops, timing(q, "enter", options)));
    }
  }
  return items;
}

// Whether a shown primitive is the source of a split, so that it doesn't exit on its own.
function splits(next, p, matches) {
  return p.key !== undefined && next.some((q, j) => matches[j] < 0 && q.groupKey === p.key);
}

// The attributes of a primitive with the values of another where it has them, such as the box of a
// bar that points split from.
function toward(attrs, other) {
  return Object.fromEntries(Object.entries(attrs).map(([key, v]) => [key, other[key] ?? v]));
}

function opsOf(a, b) {
  return a.ops.length === b.ops.length ? b.ops : a.ops;
}

// The attributes of a state, without the ones the row doesn't give, else a fade.
function state(attrs = {}) {
  const defined = Object.fromEntries(Object.entries(attrs).filter(([, v]) => v !== undefined));
  return Object.keys(defined).length ? defined : fade;
}

// The timing of a stage of a primitive: its own, else its update timing, else the flow's.
function timing({timing = {}}, stage, options) {
  const own = timing[stage] ?? {};
  const update = timing.update ?? {};
  const pick = (name) => own[name] ?? update[name] ?? options[name];
  return {delay: pick("delay"), duration: pick("duration"), ease: easeOf(pick("ease"))};
}

// An animated primitive, shown always, until it ends (exits), or once it ends (merge targets).
function item(source, show, from, to, ops0, ops1, {delay, duration, ease}) {
  const attrs = interpolateAttrs(from, to);
  const ops = interpolateOps(ops0, ops1);
  const local = (elapsed) =>
    duration > 0 ? Math.max(0, Math.min(1, (elapsed - delay) / duration)) : +(elapsed >= delay);
  return {
    end: delay + duration,
    // The primitive at a time since the start, or null if it isn't shown, with its identity, so
    // that a render during the animation starts from it.
    at(elapsed) {
      const t = local(elapsed);
      if ((show === "until-end" && t >= 1) || (show === "at-end" && t < 1)) return null;
      const e = ease(t);
      return {...source, attrs: attrs(e), ops: ops(e)};
    },
  };
}
