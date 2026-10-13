// Builds the terminal renderer's Rust backend to WebAssembly and inlines the
// binary as a base64 module, so it loads without a bundler or a network request.
import {execSync} from "node:child_process";
import {readFileSync, rmSync, writeFileSync, readdirSync} from "node:fs";
import {join} from "node:path";
import {homedir} from "node:os";

const out = "src/terminal/backend";

// Remap absolute paths (e.g., the cargo registry) so the output doesn't depend on the build machine.
const RUSTFLAGS = `--remap-path-prefix=${homedir()}=~ --remap-path-prefix=${process.cwd()}=.`;

execSync(`wasm-pack build ./rust --out-dir ../${out} --out-name index --target web`, {
  stdio: "inherit",
  env: {...process.env, RUSTFLAGS},
});

const wasm = readFileSync(join(out, "index_bg.wasm")).toString("base64");
writeFileSync(join(out, "wasm.js"), `export default "${wasm}";\n`);

for (const file of readdirSync(out)) {
  if (file !== "index.js" && file !== "wasm.js") rmSync(join(out, file));
}
