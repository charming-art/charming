// A promise for the end of the animation of the last render, resolved at once without one.
export function flow$transition() {
  return this._context.transitionState?.promise ?? Promise.resolve();
}
