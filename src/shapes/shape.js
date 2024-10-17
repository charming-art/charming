import {flow} from "../flow.js";
import {encode} from "../transform/encode.js";

export function shape(transform) {
  return (...args) => {
    const render = () => (data) => ({...data, transform});
    if (typeof args[0] === "object") return flow(encode(args[0]), render());
    return flow(...args, render());
  };
}
