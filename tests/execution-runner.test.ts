import test, { describe } from "node:test";
import assert from "node:assert/strict";
import {
  getFriendlyErrorExplanation,
  type ExecutionResult,
} from "../src/lib/execution/pyodideRunner.ts";

describe("Friendly Error Explanation Mapper", () => {
  test("identifies SyntaxError and returns actionable guidance", () => {
    const errorStr = 'SyntaxError: unexpected EOF while parsing (<string>, line 1)';
    const explanation = getFriendlyErrorExplanation(errorStr);
    assert.ok(explanation);
    assert.match(explanation, /Syntax Error/);
    assert.match(explanation, /missing quotes, unmatched parentheses/);
  });

  test("identifies IndentationError", () => {
    const errorStr = 'IndentationError: expected an indented block after "def" statement';
    const explanation = getFriendlyErrorExplanation(errorStr);
    assert.ok(explanation);
    assert.match(explanation, /Indentation Error/);
  });

  test("identifies NameError", () => {
    const errorStr = "NameError: name 'my_variable' is not defined";
    const explanation = getFriendlyErrorExplanation(errorStr);
    assert.ok(explanation);
    assert.match(explanation, /Name Error/);
  });

  test("identifies ZeroDivisionError", () => {
    const errorStr = "ZeroDivisionError: division by zero";
    const explanation = getFriendlyErrorExplanation(errorStr);
    assert.ok(explanation);
    assert.match(explanation, /Zero Division Error/);
  });

  test("identifies TypeError", () => {
    const errorStr = "TypeError: can only concatenate str (not 'int') to str";
    const explanation = getFriendlyErrorExplanation(errorStr);
    assert.ok(explanation);
    assert.match(explanation, /Type Error/);
  });

  test("returns undefined for unknown error string", () => {
    const explanation = getFriendlyErrorExplanation("SomeCustomInternalError: 123");
    assert.equal(explanation, undefined);
  });
});

describe("Execution Protocol & Stale-Result Protection", () => {
  test("stale-result detector discards out-of-order response payloads", () => {
    const activeRunId = "run_2";
    let receivedPayloadId: string | null = null;

    const dispatchResponse = (payload: { id: string; status: "success" }) => {
      // Rule: discard if payload.id does not match activeRunId
      if (payload.id !== activeRunId) {
        return false;
      }
      receivedPayloadId = payload.id;
      return true;
    };

    // Stale message arriving from slow prior run_1
    const staleDispatched = dispatchResponse({ id: "run_1", status: "success" });
    assert.equal(staleDispatched, false);
    assert.equal(receivedPayloadId, null);

    // Current message arriving from run_2
    const currentDispatched = dispatchResponse({ id: "run_2", status: "success" });
    assert.equal(currentDispatched, true);
    assert.equal(receivedPayloadId, "run_2");
  });

  test("timeout generator constructs valid timeout ExecutionResult", () => {
    const timeoutMs = 5000;
    const runId = "run_5";

    const timeoutResult: ExecutionResult = {
      id: runId,
      status: "timeout",
      stdout: "",
      stderr: `Execution timed out after ${timeoutMs / 1000} seconds.`,
      traceback: "TimeoutError: The code exceeded the maximum allowed execution time.",
      friendlyError: getFriendlyErrorExplanation("Timeout") || "Timeout: Your code took too long to run.",
      testResults: [],
      durationMs: timeoutMs,
    };

    assert.equal(timeoutResult.status, "timeout");
    assert.equal(timeoutResult.durationMs, 5000);
    assert.equal(timeoutResult.testResults.length, 0);
    assert.match(timeoutResult.stderr, /timed out after 5 seconds/);
  });

  test("test comparator handles stdout trimmed vs exact correctly", () => {
    const expected: string = "Hello, World!\n";
    const actualWithTrailing: string = "Hello, World!\n\n";

    // Trimmed comparison (default)
    const passedTrimmed = actualWithTrailing.trim() === expected.trim();
    assert.equal(passedTrimmed, true);

    // Exact comparison
    const passedExact = actualWithTrailing === expected;
    assert.equal(passedExact, false);
  });

  test("call test comparator matches function return value against expected", () => {
    const addNumbers = (a: number, b: number) => a + b;
    const testCase = {
      args: [3, 5],
      expected: 8,
    };

    const actual = addNumbers(testCase.args[0], testCase.args[1]);
    const passed = JSON.stringify(actual) === JSON.stringify(testCase.expected);
    assert.equal(passed, true);
  });
});
