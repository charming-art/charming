import "./install-canvas-mock.js";
import beautify from "js-beautify";
import {test, expect} from "vitest";

const TYPE_TEXT = 3;

function cleanWhitespace(root) {
  if (!(root instanceof Node)) return root;
  const walker = document.createTreeWalker(root);
  const removeNodes = [];
  while (walker.nextNode()) {
    const node = walker.currentNode;
    switch (node.nodeType) {
      case TYPE_TEXT: {
        const text = node.data.trim();
        node.data = text;
        if (text === "") {
          removeNodes.push(node);
        }
      }
    }
  }
  for (const node of removeNodes) node.remove();
  return root;
}

function isCanvas(node) {
  return node instanceof HTMLCanvasElement;
}

// A standalone SVG document, such as the node of an SVG renderer, is stored as an .svg file.
function isSVG(node) {
  return node instanceof SVGSVGElement && node.hasAttribute("xmlns");
}

function format(node) {
  if (isCanvas(node)) return [node.toString(), "txt"];
  if (isSVG(node))
    return [beautify.html(node.outerHTML, {indent_size: 2, inline: ["title", "tspan", "span", "a", "i"]}), "svg"];
  return [cleanWhitespace(node), "html"];
}

// Snapshots are written to ./output/ next to the calling spec file.
export function snapshot(cases) {
  const hasOnly = Object.values(cases).some((fn) => fn.only);
  const filtered = hasOnly ? Object.fromEntries(Object.entries(cases).filter(([, fn]) => fn.only)) : cases;
  for (const [name, fn] of Object.entries(filtered)) {
    test(`${name} should match snapshot`, async () => {
      const [value, ext] = format(await fn());
      await expect(value).toMatchFileSnapshot(`./output/${name}.${ext}`);
    });
  }
}
