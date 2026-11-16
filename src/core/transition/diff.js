import {easeOf, interpolateAttrs, interpolateOps} from "./interpolate.js";

// A mark fades in and out unless it gives its own states.
const fade = {fillOpacity: 0, strokeOpacity: 0};

// The items that animate from the primitives shown, prev, to the primitives drawn, next. A drawn
// primitive matches a shown one by its key, else by its datum, else by its position in the flow,
// within the same shape of the flow, and then updates; keyed primitives only match by key. One that doesn't match may split from a
// shown primitive whose key is its group key; a shown one that doesn't match may merge into a drawn
// primitive whose key is its group key. The others enter or exit.
export function diff(prev, next, options) {
  const used = new Set();
  const byKey = new Map();
  const byDatum = new Map();
  const byPosition = new Map();
  const keyed = new Map();
  prev.forEach((p, i) => {
    if (p.key !== undefined) (byKey.set(`${p.path}\0${p.key}`, i), keyed.has(p.key) || keyed.set(p.key, i));
    if (p.datum) (byDatum.get(p.path) ?? byDatum.set(p.path, new Map()).get(p.path)).set(p.datum, i);
    // A keyed primitive only matches by its key.
    if (p.key === undefined) byPosition.set(`${p.path}\0${p.position}`, i);
  });
  const take = (i) => (i !== undefined && !used.has(i) ? (used.add(i), i) : -1);
  const matches = next.map((q) => {
    if (q.key !== undefined) return take(byKey.get(`${q.path}\0${q.key}`));
    // A primitive whose group is shown splits from it rather than matching otherwise.
    if (q.groupKey !== undefined && keyed.has(q.groupKey)) return -1;
    let i = q.datum ? take(byDatum.get(q.path)?.get(q.datum)) : -1;
    if (i < 0) i = take(byPosition.get(`${q.path}\0${q.position}`));
    return i;
  });

  // Group keys: a drawn primitive splits from the shown one keyed by its group key, and a shown one
  // merges into the drawn one keyed by its group key.
  const nextKeyed = new Map();
  next.forEach((q, j) => matches[j] < 0 && q.key !== undefined && !nextKeyed.has(q.key) && nextKeyed.set(q.key, j));
  const merged = new Set();
  const exits = [];
  prev.forEach((p, i) => {
    if (used.has(i)) return;
    const j = p.groupKey !== undefined ? nextKeyed.get(p.groupKey) : undefined;
    if (j !== undefined) {
      merged.add(j);
      exits.push(
        item(
          p,
          "until-end",
          p.attrs,
          toward(p.attrs, next[j].attrs),
          p.ops,
          opsOf(p, next[j]),
          timing(p, "update", options),
        ),
      );
    } else if (!splits(next, p, matches)) {
      exits.push(
        item(p, "until-end", p.attrs, {...p.attrs, ...state(p.exit)}, p.ops, p.ops, timing(p, "exit", options)),
      );
    }
  });
  const items = next.map((q, j) => {
    const i = matches[j];
    if (i >= 0) return item(q, "always", prev[i].attrs, q.attrs, prev[i].ops, q.ops, timing(q, "update", options));
    if (merged.has(j)) return item(q, "at-end", q.attrs, q.attrs, q.ops, q.ops, timing(q, "update", options));
    const k = q.groupKey !== undefined ? keyed.get(q.groupKey) : undefined;
    if (k !== undefined && !used.has(k)) {
      const p = prev[k];
      return item(q, "always", toward(q.attrs, p.attrs), q.attrs, opsOf(q, p), q.ops, timing(q, "update", options));
    }
    return item(q, "always", {...q.attrs, ...state(q.enter)}, q.attrs, q.ops, q.ops, timing(q, "enter", options));
  });
  return [...exits, ...items];
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
