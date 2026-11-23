#!/usr/bin/env node
/** Run the core Blink/SwiftShader suites and fail loudly when browser deps are missing. */
import { spawn } from "node:child_process";
import { serve, browserDeps } from "../tests/lib-browser.mjs";

if (!(await browserDeps())) {
  console.error("Browser tests require the locked dev dependencies. Run npm ci, then npm run test:browser.");
  process.exit(1);
}

const { server, port } = await serve();
try {
  const suites = [
    ["tests/07-browser.mjs", `http://127.0.0.1:${port}/keyspace.html`],
    ["tests/10-lens3d-wasm.mjs"],
    ["tests/openpgp-workbench-browser.mjs"],
    ["--test", "tests/subsurface-viewers-browser.test.mjs"],
  ];
  for (const args of suites) {
    console.log(`\n$ node ${args.join(" ")}`);
    const status = await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, args, { stdio: "inherit" });
      child.once("error", reject);
      child.once("exit", (code, signal) => resolve(code ?? (signal ? 1 : 0)));
    });
    if (status !== 0) {
      process.exitCode = status;
      break;
    }
  }
} finally {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}
