export const PROPERTY_HARNESS_POLICY = "deterministic-generative-properties-v1" as const;

export type PropertyContext = { run: number; seed: number; random: () => number; integer: (min: number, max: number) => number; pick: <T>(values: readonly T[]) => T };

function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

function context(seed: number, run: number): PropertyContext {
  const random = seededRandom((seed ^ Math.imul(run + 1, 0x9e3779b1)) >>> 0);
  const integer = (min: number, max: number) => min + Math.floor(random() * (max - min + 1));
  const pick = <T>(values: readonly T[]) => {
    if (!values.length) throw new Error("Property generator cannot pick from an empty collection.");
    return values[integer(0, values.length - 1)];
  };
  return { run, seed, random, integer, pick };
}

export function runDeterministicProperty<T>(input: {
  name: string;
  runs: number;
  seed: number;
  generate: (context: PropertyContext) => T;
  assert: (value: T, context: PropertyContext) => void;
  shrink?: (value: T) => T[];
}) {
  if (!Number.isInteger(input.runs) || input.runs < 1 || input.runs > 20_000) throw new Error("Property run count must stay between 1 and 20,000.");
  for (let run = 0; run < input.runs; run += 1) {
    const propertyContext = context(input.seed, run);
    const value = input.generate(propertyContext);
    try {
      input.assert(value, propertyContext);
    } catch (error) {
      let minimal = value;
      if (input.shrink) {
        let changed = true;
        let steps = 0;
        while (changed && steps < 100) {
          changed = false;
          for (const candidate of input.shrink(minimal)) {
            try { input.assert(candidate, propertyContext); }
            catch { minimal = candidate; changed = true; break; }
          }
          steps += 1;
        }
      }
      const reason = error instanceof Error ? error.message : String(error);
      throw new Error(`Property ${input.name} failed at seed=${input.seed} run=${run}; counterexample=${JSON.stringify(minimal)}; ${reason}`);
    }
  }
}
