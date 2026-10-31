/**
 * Challenge Test Evaluator & Comparator Utilities
 * Source of truth: TRD Section 5 & AGENTS.md
 * 
 * Provides numerical approximate comparisons (with configurable epsilon tolerance),
 * deep collection comparisons, Python-centric type inspection, and mismatch diagnosis.
 */

export function isApproxEqual(
  actual: unknown,
  expected: unknown,
  tolerance: number = 0.0001
): boolean {
  // Direct primitive equality (identical values or references)
  if (actual === expected) {
    return true;
  }

  // Number comparison with epsilon tolerance
  if (typeof actual === "number" && typeof expected === "number") {
    if (isNaN(actual) && isNaN(expected)) return true;
    if (isNaN(actual) || isNaN(expected)) return false;
    return Math.abs(actual - expected) <= tolerance;
  }

  // Array comparison
  if (Array.isArray(actual) && Array.isArray(expected)) {
    if (actual.length !== expected.length) return false;
    for (let i = 0; i < actual.length; i++) {
      if (!isApproxEqual(actual[i], expected[i], tolerance)) {
        return false;
      }
    }
    return true;
  }

  // Object / dictionary comparison
  if (
    actual !== null &&
    expected !== null &&
    typeof actual === "object" &&
    typeof expected === "object" &&
    !Array.isArray(actual) &&
    !Array.isArray(expected)
  ) {
    const actualKeys = Object.keys(actual as Record<string, unknown>);
    const expectedKeys = Object.keys(expected as Record<string, unknown>);
    if (actualKeys.length !== expectedKeys.length) return false;

    const actualObj = actual as Record<string, unknown>;
    const expectedObj = expected as Record<string, unknown>;

    for (const key of expectedKeys) {
      if (!Object.prototype.hasOwnProperty.call(actualObj, key)) {
        return false;
      }
      if (!isApproxEqual(actualObj[key], expectedObj[key], tolerance)) {
        return false;
      }
    }
    return true;
  }

  return false;
}

/**
 * Returns Python-style type name for a JavaScript value
 */
export function getPythonTypeName(val: unknown): string {
  if (val === null || val === undefined) return "None";
  if (typeof val === "boolean") return "bool";
  if (typeof val === "number") {
    return Number.isInteger(val) ? "int" : "float";
  }
  if (typeof val === "string") return "str";
  if (Array.isArray(val)) return "list";
  if (typeof val === "object") return "dict";
  return typeof val;
}

/**
 * Formats a Python function call signature for display
 */
export function formatCallSignature(fn: string, args: unknown[]): string {
  const formattedArgs = (args || []).map((arg) => {
    if (arg === null) return "None";
    if (typeof arg === "string") return `"${arg}"`;
    return JSON.stringify(arg);
  });
  return `${fn}(${formattedArgs.join(", ")})`;
}

export interface EvaluationDiagnosis {
  passed: boolean;
  actualType: string;
  expectedType: string;
  isTypeMismatch: boolean;
  diagnosticHint?: string;
}

/**
 * Evaluates a call test and produces diagnostic metadata
 */
export function evaluateCall(
  actual: unknown,
  expected: unknown,
  compare: "equal" | "approx" = "equal",
  tolerance: number = 0.0001
): EvaluationDiagnosis {
  const actualType = getPythonTypeName(actual);
  const expectedType = getPythonTypeName(expected);
  const isTypeMismatch = actualType !== expectedType;

  let passed = false;

  if (compare === "approx") {
    passed = isApproxEqual(actual, expected, tolerance);
  } else {
    // Exact structural equality
    passed = JSON.stringify(actual) === JSON.stringify(expected);
  }

  let diagnosticHint: string | undefined = undefined;

  if (!passed) {
    if (actual === null || actual === undefined) {
      diagnosticHint =
        "Your function returned None. Did you forget a 'return' statement, or use 'print()' instead of 'return'?";
    } else if (isTypeMismatch) {
      diagnosticHint = `Type mismatch: expected a ${expectedType} value, but your function returned a ${actualType}.`;
    }
  }

  return {
    passed,
    actualType,
    expectedType,
    isTypeMismatch,
    diagnosticHint,
  };
}
