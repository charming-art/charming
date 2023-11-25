import node from "@rollup/plugin-node-resolve";
import { wasm } from "@rollup/plugin-wasm";
import terser from "@rollup/plugin-terser";
import commonjs from "@rollup/plugin-commonjs";
import polyfill from "rollup-plugin-polyfill-node";

const onwarn = (message, warn) => {
  if (message.code === "CIRCULAR_DEPENDENCY") return;
  warn(message);
};

const umd = {
  input: "src/index.js",
  output: {
    format: "umd",
    name: "cm",
  },
  plugins: [wasm({ targetEnv: "auto-inline" }), commonjs(), polyfill(), node()],
  onwarn,
};

export default [
  {
    input: "src/index.js",
    output: {
      format: "es",
      dir: "dist/es",
      preserveModules: true,
    },
    external: [/node_modules/],
    plugins: [wasm({ targetEnv: "auto-inline" }), commonjs(), node()],
    onwarn,
  },
  {
    ...umd,
    output: {
      ...umd.output,
      file: "dist/cm.umd.js",
    },
  },
  {
    ...umd,
    output: {
      ...umd.output,
      file: "dist/cm.umd.min.js",
    },
    plugins: [...umd.plugins, terser()],
  },
];
