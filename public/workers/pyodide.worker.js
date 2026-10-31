/**
 * PyQuest Dedicated Pyodide Execution Web Worker
 * Source of truth: TRD Section 5 & AGENTS.md
 * 
 * Runs Python code and test checks isolated in a browser Web Worker.
 * All tests executed here are Tier A (untrusted practice checks).
 */

const PYODIDE_CDN_BASE = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/";
const MAX_OUTPUT_BYTES = 64 * 1024; // 64 KB output cap per TRD 5.2

let pyodideInstance = null;
let isInitializing = false;
let initError = null;

let capturedStdout = "";
let capturedStderr = "";

function appendStdout(text) {
  if (capturedStdout.length < MAX_OUTPUT_BYTES) {
    capturedStdout += text + "\n";
  } else if (!capturedStdout.endsWith("\n[Output truncated: exceeded 64 KB limit]")) {
    capturedStdout += "\n[Output truncated: exceeded 64 KB limit]";
  }
}

function appendStderr(text) {
  if (capturedStderr.length < MAX_OUTPUT_BYTES) {
    capturedStderr += text + "\n";
  } else if (!capturedStderr.endsWith("\n[Stderr truncated: exceeded 64 KB limit]")) {
    capturedStderr += "\n[Stderr truncated: exceeded 64 KB limit]";
  }
}

async function getPyodide() {
  if (pyodideInstance) return pyodideInstance;
  if (initError) throw new Error(initError);

  if (isInitializing) {
    // Wait for in-progress initialization
    while (isInitializing) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    if (pyodideInstance) return pyodideInstance;
    throw new Error(initError || "Pyodide initialization failed");
  }

  isInitializing = true;
  self.postMessage({ type: "STATUS", status: "loading", message: "Downloading Python WebAssembly runtime..." });

  try {
    importScripts(PYODIDE_CDN_BASE + "pyodide.js");

    pyodideInstance = await loadPyodide({
      indexURL: PYODIDE_CDN_BASE,
      stdout: (msg) => appendStdout(msg),
      stderr: (msg) => appendStderr(msg),
    });

    // Configure standard environment limits
    pyodideInstance.runPython(`
import sys
sys.setrecursionlimit(1000)
`);

    isInitializing = false;
    self.postMessage({ type: "STATUS", status: "ready", version: "0.26.4" });
    return pyodideInstance;
  } catch (err) {
    isInitializing = false;
    initError = (err && err.message) ? err.message : String(err);
    self.postMessage({ type: "STATUS", status: "error", error: initError });
    throw new Error(initError);
  }
}

// Immediately trigger background preload of runtime
getPyodide().catch(() => {});

self.onmessage = async function (e) {
  const { type, payload } = e.data || {};

  if (type === "PING") {
    self.postMessage({ type: "PONG" });
    return;
  }

  if (type !== "RUN") {
    self.postMessage({
      type: "ERROR",
      error: `Unknown message type: ${type}`,
    });
    return;
  }

  const { id, code, stdin = "", tests = [] } = payload || {};

  if (!id) {
    self.postMessage({ type: "ERROR", error: "Missing execution run ID" });
    return;
  }

  const startTime = performance.now();
  capturedStdout = "";
  capturedStderr = "";

  try {
    const py = await getPyodide();

    // Prepare fresh execution namespace
    const ns = py.toPy({});

    // Inject stdin if provided
    if (stdin) {
      py.runPython(`
import io, sys
sys.stdin = io.StringIO(${JSON.stringify(stdin)})
`, { globals: ns });
    }

    // Execute learner code in isolated namespace
    py.runPython(code, { globals: ns });

    // Helpers for evaluation & diagnostics
    function isApproxEqual(actual, expected, tolerance = 0.0001) {
      if (actual === expected) return true;
      if (typeof actual === "number" && typeof expected === "number") {
        if (isNaN(actual) && isNaN(expected)) return true;
        if (isNaN(actual) || isNaN(expected)) return false;
        return Math.abs(actual - expected) <= tolerance;
      }
      if (Array.isArray(actual) && Array.isArray(expected)) {
        if (actual.length !== expected.length) return false;
        for (let j = 0; j < actual.length; j++) {
          if (!isApproxEqual(actual[j], expected[j], tolerance)) return false;
        }
        return true;
      }
      if (
        actual !== null &&
        expected !== null &&
        typeof actual === "object" &&
        typeof expected === "object" &&
        !Array.isArray(actual) &&
        !Array.isArray(expected)
      ) {
        const actualKeys = Object.keys(actual);
        const expectedKeys = Object.keys(expected);
        if (actualKeys.length !== expectedKeys.length) return false;
        for (const k of expectedKeys) {
          if (!Object.prototype.hasOwnProperty.call(actual, k)) return false;
          if (!isApproxEqual(actual[k], expected[k], tolerance)) return false;
        }
        return true;
      }
      return false;
    }

    function getPythonTypeName(val) {
      if (val === null || val === undefined) return "None";
      if (typeof val === "boolean") return "bool";
      if (typeof val === "number") return Number.isInteger(val) ? "int" : "float";
      if (typeof val === "string") return "str";
      if (Array.isArray(val)) return "list";
      if (typeof val === "object") return "dict";
      return typeof val;
    }

    function formatCallSignature(fn, args) {
      const formatted = (args || []).map((arg) => {
        if (arg === null) return "None";
        if (typeof arg === "string") return `"${arg}"`;
        return JSON.stringify(arg);
      });
      return `${fn}(${formatted.join(", ")})`;
    }

    function marshallArg(arg) {
      if (arg === null || arg === undefined) return arg;
      if (typeof arg === "object") {
        try {
          return py.toPy(arg);
        } catch {
          return arg;
        }
      }
      return arg;
    }

    // Run test cases if provided
    const testResults = [];
    if (Array.isArray(tests) && tests.length > 0) {
      for (let i = 0; i < tests.length; i++) {
        const testCase = tests[i];
        if (testCase.kind === "stdout") {
          const trimmedExpected = String(testCase.expected).trim().replace(/\r\n/g, "\n");
          const trimmedActual = capturedStdout.trim().replace(/\r\n/g, "\n");
          const passed = (testCase.compare === "exact")
            ? capturedStdout === testCase.expected
            : trimmedActual === trimmedExpected;

          testResults.push({
            name: `Test ${i + 1}: Output Check`,
            kind: "stdout",
            passed,
            expected: testCase.expected,
            actual: capturedStdout,
            feedbackOnFail: testCase.feedbackOnFail,
          });
        } else if (testCase.kind === "call") {
          const signature = formatCallSignature(testCase.fn, testCase.args);
          try {
            const fnObj = ns.get(testCase.fn);
            if (!fnObj) {
              testResults.push({
                name: `Test ${i + 1}: ${signature}`,
                kind: "call",
                callSignature: signature,
                passed: false,
                expected: testCase.expected,
                actual: `Function '${testCase.fn}' is not defined`,
                feedbackOnFail: testCase.feedbackOnFail || `Make sure you defined the function '${testCase.fn}'.`,
                diagnosticHint: `Function '${testCase.fn}' was not found in the global namespace. Check the spelling of the function name.`,
              });
              continue;
            }

            // Convert arguments safely
            const args = (testCase.args || []).map(marshallArg);
            const rawResult = fnObj(...args);
            const actual = (rawResult && typeof rawResult.toJs === "function")
              ? rawResult.toJs({ dict_converter: Object.fromEntries })
              : rawResult;

            const actualType = getPythonTypeName(actual);
            const expectedType = getPythonTypeName(testCase.expected);
            const isTypeMismatch = actualType !== expectedType;
            const tolerance = typeof testCase.tolerance === "number" ? testCase.tolerance : 0.0001;

            let passed = false;
            if (testCase.compare === "approx") {
              passed = isApproxEqual(actual, testCase.expected, tolerance);
            } else {
              passed = JSON.stringify(actual) === JSON.stringify(testCase.expected);
            }

            let diagnosticHint = undefined;
            if (!passed) {
              if (actual === null || actual === undefined) {
                diagnosticHint = "Your function returned None. Did you forget a 'return' statement, or use 'print()' instead of 'return'?";
              } else if (isTypeMismatch) {
                diagnosticHint = `Type mismatch: expected ${expectedType}, but your function returned ${actualType}.`;
              }
            }

            testResults.push({
              name: `Test ${i + 1}: ${signature}`,
              kind: "call",
              callSignature: signature,
              passed,
              expected: testCase.expected,
              actual,
              expectedType,
              actualType,
              isTypeMismatch,
              diagnosticHint,
              feedbackOnFail: testCase.feedbackOnFail,
            });
          } catch (callErr) {
            const errStr = (callErr && callErr.message) ? callErr.message : String(callErr);
            let diagnosticHint = undefined;
            if (errStr.includes("takes") && (errStr.includes("positional argument") || errStr.includes("given"))) {
              diagnosticHint = "Parameter count mismatch: your function does not accept the number of arguments required by the challenge.";
            }

            testResults.push({
              name: `Test ${i + 1}: ${signature}`,
              kind: "call",
              callSignature: signature,
              passed: false,
              expected: testCase.expected,
              actual: `Exception during test call: ${errStr}`,
              diagnosticHint,
              feedbackOnFail: testCase.feedbackOnFail,
            });
          }
        }
      }
    }

    const durationMs = Math.round(performance.now() - startTime);

    self.postMessage({
      type: "RESULT",
      payload: {
        id,
        status: "success",
        stdout: capturedStdout,
        stderr: capturedStderr,
        testResults,
        durationMs,
      },
    });
  } catch (err) {
    const durationMs = Math.round(performance.now() - startTime);
    const errMsg = (err && err.message) ? err.message : String(err);

    self.postMessage({
      type: "RESULT",
      payload: {
        id,
        status: "error",
        stdout: capturedStdout,
        stderr: capturedStderr,
        traceback: errMsg,
        testResults: [],
        durationMs,
      },
    });
  }
};
