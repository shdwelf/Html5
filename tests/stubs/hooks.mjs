/** Resolve hook: keeps js/viewer.js untouched, stubs only the WebGL backend. */
export async function resolve(specifier, context, next) {
  if (specifier.endsWith("three.module.min.js") || specifier.endsWith("OrbitControls.js")) {
    return { url: new URL("./three-stub.mjs", import.meta.url).href, shortCircuit: true };
  }
  return next(specifier, context);
}
