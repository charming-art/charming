import {tag} from "./tag.js";

export const HTML = tag((string) => {
  const div = document.createElement("div");
  div.innerHTML = string;
  return div;
});
