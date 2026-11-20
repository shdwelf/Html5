// Exact integer workload contract for a small, synthetic 4DWM terrain check.
// Inputs are quantized elevation-like values in metres; not source DEM data.
export const DEM_SSE_EXAMPLE = Object.freeze({
  schema: 1,
  samples: [125, 310, 480, 655],
  reference: [120, 315, 470, 650],
});
export const DEM_SSE_BOUNDS = Object.freeze({ minSamples: 1, maxSamples: 8, minValue: 0, maxValue: 1000 });

export function validateDemSseInput(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError("input must be an object");
  if (Object.keys(value).sort().join(",") !== "reference,samples,schema" || value.schema !== 1) throw new TypeError("expected only schema, samples, and reference with schema 1");
  const { samples, reference } = value;
  if (!Array.isArray(samples) || !Array.isArray(reference) || samples.length !== reference.length) throw new TypeError("samples and reference must be equal-length arrays");
  if (samples.length < DEM_SSE_BOUNDS.minSamples || samples.length > DEM_SSE_BOUNDS.maxSamples) throw new RangeError("expected 1–8 paired values");
  for (const [index, number] of [...samples, ...reference].entries()) {
    if (!Number.isInteger(number) || number < DEM_SSE_BOUNDS.minValue || number > DEM_SSE_BOUNDS.maxValue) {
      throw new RangeError(`paired integer ${index} must be in 0–1000`);
    }
  }
  return { schema: 1, samples: [...samples], reference: [...reference] };
}

export function demSseReference(value) {
  const input = validateDemSseInput(value);
  const residuals = input.samples.map((sample, index) => sample - input.reference[index]);
  return { residuals, squaredErrorSum: residuals.reduce((sum, residual) => sum + residual * residual, 0) };
}
