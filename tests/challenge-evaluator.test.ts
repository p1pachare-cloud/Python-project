import test, { describe } from "node:test";
import assert from "node:assert/strict";
import {
  isApproxEqual,
  getPythonTypeName,
  formatCallSignature,
  evaluateCall,
} from "../src/lib/execution/evaluator.ts";

describe("Approximate Float Comparator (isApproxEqual)", () => {
  test("matches exact integers and strings", () => {
    assert.equal(isApproxEqual(42, 42), true);
    assert.equal(isApproxEqual("hello", "hello"), true);
    assert.equal(isApproxEqual(true, true), true);
    assert.equal(isApproxEqual(42, 43), false);
    assert.equal(isApproxEqual("a", "b"), false);
  });

  test("handles floating point arithmetic drift (e.g. 0.1 + 0.2 vs 0.3)", () => {
    const sum = 0.1 + 0.2; // 0.30000000000000004
    assert.notEqual(sum, 0.3);
    assert.equal(isApproxEqual(sum, 0.3, 1e-4), true);
  });

  test("respects configurable tolerance boundaries", () => {
    assert.equal(isApproxEqual(10.005, 10.0, 0.01), true);
    assert.equal(isApproxEqual(10.02, 10.0, 0.01), false);
    assert.equal(isApproxEqual(-5.00002, -5.0, 1e-4), true);
    assert.equal(isApproxEqual(-5.02, -5.0, 1e-4), false);
  });

  test("recursively compares floating-point arrays", () => {
    const actual = [0.1 + 0.2, 5.00001, -3.14159];
    const expected = [0.3, 5.0, -3.1416];
    assert.equal(isApproxEqual(actual, expected, 1e-4), true);

    const mismatchedLength = [0.3, 5.0];
    assert.equal(isApproxEqual(actual, mismatchedLength, 1e-4), false);

    const exceedingTolerance = [0.3, 5.1, -3.1416];
    assert.equal(isApproxEqual(actual, exceedingTolerance, 1e-4), false);
  });

  test("recursively compares dictionary structures with floats", () => {
    const actual = { temp: 98.6000001, status: "normal" };
    const expected = { temp: 98.6, status: "normal" };
    assert.equal(isApproxEqual(actual, expected, 1e-4), true);

    const wrongKey = { temperature: 98.6, status: "normal" };
    assert.equal(isApproxEqual(actual, wrongKey, 1e-4), false);
  });

  test("handles NaN and null gracefully", () => {
    assert.equal(isApproxEqual(NaN, NaN), true);
    assert.equal(isApproxEqual(NaN, 5), false);
    assert.equal(isApproxEqual(null, 5), false);
    assert.equal(isApproxEqual(null, null), true);
  });
});

describe("Python Type Inspection (getPythonTypeName)", () => {
  test("identifies primitive and composite Python types correctly", () => {
    assert.equal(getPythonTypeName(null), "None");
    assert.equal(getPythonTypeName(undefined), "None");
    assert.equal(getPythonTypeName(true), "bool");
    assert.equal(getPythonTypeName(false), "bool");
    assert.equal(getPythonTypeName(42), "int");
    assert.equal(getPythonTypeName(0), "int");
    assert.equal(getPythonTypeName(-10), "int");
    assert.equal(getPythonTypeName(3.14), "float");
    assert.equal(getPythonTypeName("Python"), "str");
    assert.equal(getPythonTypeName([1, 2, 3]), "list");
    assert.equal(getPythonTypeName({ a: 1 }), "dict");
  });
});

describe("Function Call Signature Formatting (formatCallSignature)", () => {
  test("formats function names with multi-argument calls", () => {
    assert.equal(formatCallSignature("add_numbers", [3, 5]), "add_numbers(3, 5)");
    assert.equal(
      formatCallSignature("celsius_to_fahrenheit", [100]),
      "celsius_to_fahrenheit(100)"
    );
    assert.equal(
      formatCallSignature("greet", ["Alice", null]),
      'greet("Alice", None)'
    );
    assert.equal(formatCallSignature("get_empty", []), "get_empty()");
  });
});

describe("Test Call Evaluation & Diagnostic Diagnosis (evaluateCall)", () => {
  test("evaluates exact equality matching", () => {
    const diag = evaluateCall(8, 8, "equal");
    assert.equal(diag.passed, true);
    assert.equal(diag.isTypeMismatch, false);
    assert.equal(diag.diagnosticHint, undefined);
  });

  test("evaluates approx float matching", () => {
    const diag = evaluateCall(0.1 + 0.2, 0.3, "approx", 1e-4);
    assert.equal(diag.passed, true);
  });

  test("detects None return and flags possible print vs return confusion", () => {
    const diag = evaluateCall(null, 8, "equal");
    assert.equal(diag.passed, false);
    assert.equal(diag.actualType, "None");
    assert.equal(diag.expectedType, "int");
    assert.ok(diag.diagnosticHint);
    assert.match(diag.diagnosticHint, /returned None/);
    assert.match(diag.diagnosticHint, /print\(\)/);
  });

  test("detects type mismatches with clear explanation", () => {
    // Student returned string "8" instead of int 8
    const diag = evaluateCall("8", 8, "equal");
    assert.equal(diag.passed, false);
    assert.equal(diag.isTypeMismatch, true);
    assert.equal(diag.actualType, "str");
    assert.equal(diag.expectedType, "int");
    assert.ok(diag.diagnosticHint);
    assert.match(diag.diagnosticHint, /Type mismatch: expected a int value, but your function returned a str/);
  });
});
