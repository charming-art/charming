// A promise for the end of the animation of the last render, or of its keyframes, resolved at once
// without one.
export function flow$finished() {
  const state = this._context.transitionState;
  return state?.sequence ?? state?.promise ?? Promise.resolve();
}
