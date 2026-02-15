import type { Rule } from "./types.js";

import { structuralInjectionRules } from "./structural-injection.js";
import { instructionOverrideRules } from "./instruction-override.js";
import { encodingEvasionRules } from "./encoding-evasion.js";
import { indirectInjectionRules } from "./indirect-injection.js";
import { socialEngineeringRules } from "./social-engineering.js";
import { payloadPatternRules } from "./payload-patterns.js";
import { multilingualRules } from "./multilingual.js";

export {
  structuralInjectionRules,
  instructionOverrideRules,
  encodingEvasionRules,
  indirectInjectionRules,
  socialEngineeringRules,
  payloadPatternRules,
  multilingualRules,
};

export type { Rule } from "./types.js";
export type { RuleCheckParams, RuleFinding } from "./types.js";

/**
 * Returns all built-in rules combined into a single array.
 */
export function getBuiltinRules(): Rule[] {
  return [
    ...structuralInjectionRules,
    ...instructionOverrideRules,
    ...encodingEvasionRules,
    ...indirectInjectionRules,
    ...socialEngineeringRules,
    ...payloadPatternRules,
    ...multilingualRules,
  ];
}
