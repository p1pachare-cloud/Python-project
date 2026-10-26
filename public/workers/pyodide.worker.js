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

    // Run test cases if provided
    const testResults = [];
    if (Array.isArray(tests) && tests.length > 0) {
      for (let i = 0; i < tests.length; i++) {
        const testCase = tests[i];
        if (testCase.kind === "stdout") {
          const trimmedExpected = String(testCase.expected).trim();
          const trimmedActual = capturedStdout.trim();
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
          try {
            const fnObj = ns.get(testCase.fn);
            if (!fnObj) {
              testResults.push({
                name: `Test ${i + 1}: Call ${testCase.fn}`,
                kind: "call",
                passed: false,
                expected: testCase.expected,
                actual: `Function '${testCase.fn}' is not defined`,
                feedbackOnFail: testCase.feedbackOnFail || `Make sure you defined the function '${testCase.fn}'.`,
              });
              continue;
            }

            // Convert arguments
            const args = (testCase.args || []).map((arg) => (typeof arg === "object" ? py.toPy(arg) : arg));
            const rawResult = fnObj(...args);
            const actual = (rawResult && typeof rawResult.toJs === "function") ? rawResult.toJs() : rawResult;

            const passed = JSON.stringify(actual) === JSON.stringify(testCase.expected);

            testResults.push({
              name: `Test ${i + 1}: ${testCase.fn}(${JSON.stringify(testCase.args).slice(1, -1)})`,
              kind: "call",
              passed,
              expected: testCase.expected,
              actual,
              feedbackOnFail: testCase.feedbackOnFail,
            });
          } catch (callErr) {
            testResults.push({
              name: `Test ${i + 1}: ${testCase.fn}`,
              kind: "call",
              passed: false,
              expected: testCase.expected,
              actual: `Exception during test call: ${callErr.message}`,
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
