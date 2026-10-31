import { type TestCase } from "../content/schemas.ts";

/**
 * Execution Protocol Types
 */

export interface TestResultItem {
  name: string;
  kind: "stdout" | "call";
  callSignature?: string;
  passed: boolean;
  expected: unknown;
  actual: unknown;
  expectedType?: string;
  actualType?: string;
  isTypeMismatch?: boolean;
  diagnosticHint?: string;
  feedbackOnFail?: string;
}

export interface ExecutionResult {
  id: string;
  status: "idle" | "running" | "success" | "error" | "timeout" | "cancelled";
  stdout: string;
  stderr: string;
  traceback?: string;
  friendlyError?: string;
  testResults: TestResultItem[];
  durationMs: number;
}

export type WorkerRuntimeStatus = "unloaded" | "loading" | "ready" | "error";

export interface PyodideRunnerListener {
  onStatusChange?: (status: WorkerRuntimeStatus, message?: string) => void;
  onExecutionResult?: (result: ExecutionResult) => void;
}

/**
 * Maps common Python errors to plain-language explanations
 * Source of truth: TRD FR-D5
 */
export function getFriendlyErrorExplanation(errorText: string): string | undefined {
  if (!errorText) return undefined;

  if (errorText.includes("SyntaxError")) {
    return "Syntax Error: Python didn't understand the structure of your code. Check for missing quotes, unmatched parentheses, or typos.";
  }
  if (errorText.includes("IndentationError")) {
    return "Indentation Error: Python relies on consistent spaces at the start of lines. Ensure code inside functions or loops is indented evenly.";
  }
  if (errorText.includes("NameError")) {
    return "Name Error: You used a variable or function name that Python hasn't seen yet. Check for spelling errors or define it before using it.";
  }
  if (errorText.includes("TypeError")) {
    return "Type Error: An operation was performed on incompatible data types (e.g., adding text to a number).";
  }
  if (errorText.includes("ZeroDivisionError")) {
    return "Zero Division Error: You attempted to divide a number by zero, which is mathematically undefined.";
  }
  if (errorText.includes("IndexError")) {
    return "Index Error: You tried to access an item in a list at an index that doesn't exist.";
  }
  if (errorText.includes("RecursionError")) {
    return "Recursion Error: A function called itself too many times without stopping.";
  }

  return undefined;
}

/**
 * Pyodide Web Worker Manager
 * Manages worker lifecycle, watchdog timeouts, stale-result prevention, and restarts.
 */
export class PyodideRunner {
  private worker: Worker | null = null;
  private runtimeStatus: WorkerRuntimeStatus = "unloaded";
  private statusMessage: string = "";
  private currentRunId: number = 0;
  private activeTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
  private listeners: Set<PyodideRunnerListener> = new Set();
  private pendingCallback: ((result: ExecutionResult) => void) | null = null;

  constructor() {
    // Lazily initialized in browser environment
  }

  public subscribe(listener: PyodideRunnerListener): () => void {
    this.listeners.add(listener);
    listener.onStatusChange?.(this.runtimeStatus, this.statusMessage);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getStatus(): { status: WorkerRuntimeStatus; message: string } {
    return { status: this.runtimeStatus, message: this.statusMessage };
  }

  /**
   * Initializes or gets the existing worker
   */
  public ensureWorker(): void {
    if (typeof window === "undefined") return;
    if (this.worker) return;

    this.updateStatus("loading", "Starting Python Web Worker...");

    try {
      this.worker = new Worker("/workers/pyodide.worker.js");

      this.worker.onmessage = (e: MessageEvent) => {
        this.handleWorkerMessage(e.data);
      };

      this.worker.onerror = (err) => {
        console.error("Pyodide worker error:", err);
        this.updateStatus("error", "Failed to start Python worker");
      };
    } catch (err: unknown) {
      console.error("Failed to spawn worker:", err);
      this.updateStatus("error", "Web Workers not supported or blocked by browser");
    }
  }

  private updateStatus(status: WorkerRuntimeStatus, message: string = ""): void {
    this.runtimeStatus = status;
    this.statusMessage = message;
    this.listeners.forEach((l) => l.onStatusChange?.(status, message));
  }

  private handleWorkerMessage(data: unknown): void {
    if (!data || typeof data !== "object") return;

    const msg = data as { type: string; status?: string; message?: string; error?: string; payload?: unknown };

    if (msg.type === "STATUS") {
      if (msg.status === "ready") {
        this.updateStatus("ready", "Python runtime ready");
      } else if (msg.status === "loading") {
        this.updateStatus("loading", msg.message || "Loading runtime...");
      } else if (msg.status === "error") {
        this.updateStatus("error", msg.error || "Runtime initialization error");
      }
      return;
    }

    if (msg.type === "RESULT") {
      const payload = msg.payload as {
        id: string;
        status: "success" | "error";
        stdout: string;
        stderr: string;
        traceback?: string;
        testResults?: TestResultItem[];
        durationMs: number;
      };

      // Stale-result protection: Ignore result if run ID doesn't match active run
      if (payload.id !== `run_${this.currentRunId}`) {
        return;
      }

      this.clearWatchdog();

      const friendlyError = payload.traceback
        ? getFriendlyErrorExplanation(payload.traceback)
        : undefined;

      const result: ExecutionResult = {
        id: payload.id,
        status: payload.status,
        stdout: payload.stdout || "",
        stderr: payload.stderr || "",
        traceback: payload.traceback,
        friendlyError,
        testResults: payload.testResults || [],
        durationMs: payload.durationMs || 0,
      };

      this.notifyResult(result);
    }
  }

  private clearWatchdog(): void {
    if (this.activeTimeoutTimer) {
      clearTimeout(this.activeTimeoutTimer);
      this.activeTimeoutTimer = null;
    }
  }

  private notifyResult(result: ExecutionResult): void {
    if (this.pendingCallback) {
      this.pendingCallback(result);
      this.pendingCallback = null;
    }
    this.listeners.forEach((l) => l.onExecutionResult?.(result));
  }

  /**
   * Executes code with tests and watchdog timeout
   */
  public run(
    code: string,
    tests: TestCase[] = [],
    stdin: string = "",
    timeoutMs: number = 5000
  ): Promise<ExecutionResult> {
    return new Promise((resolve) => {
      this.ensureWorker();
      this.clearWatchdog();

      this.currentRunId++;
      const runId = `run_${this.currentRunId}`;

      this.pendingCallback = resolve;

      // Start watchdog timer
      this.activeTimeoutTimer = setTimeout(() => {
        this.handleTimeout(runId, timeoutMs);
      }, timeoutMs);

      // Post execution request
      this.worker?.postMessage({
        type: "RUN",
        payload: {
          id: runId,
          code,
          stdin,
          tests,
        },
      });
    });
  }

  /**
   * Watchdog termination and automatic restart
   */
  private handleTimeout(runId: string, timeoutMs: number): void {
    if (runId !== `run_${this.currentRunId}`) return;

    this.clearWatchdog();

    // Terminate worker to break out of busy infinite loop
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }

    const timeoutResult: ExecutionResult = {
      id: runId,
      status: "timeout",
      stdout: "",
      stderr: `Execution timed out after ${timeoutMs / 1000} seconds. Infinite loop detected or operation too slow.`,
      traceback: "TimeoutError: The code exceeded the maximum allowed execution time.",
      friendlyError: "Timeout: Your code took too long to run. Check for infinite loops (e.g., 'while True' without a break condition).",
      testResults: [],
      durationMs: timeoutMs,
    };

    this.notifyResult(timeoutResult);

    // Automatically spawn fresh worker for subsequent runs
    this.ensureWorker();
  }

  /**
   * User-initiated cancellation
   */
  public cancel(): void {
    this.clearWatchdog();

    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }

    const cancelResult: ExecutionResult = {
      id: `run_${this.currentRunId}`,
      status: "cancelled",
      stdout: "",
      stderr: "Execution was cancelled by the user.",
      testResults: [],
      durationMs: 0,
    };

    this.notifyResult(cancelResult);
    this.ensureWorker();
  }

  /**
   * Clean shutdown
   */
  public destroy(): void {
    this.clearWatchdog();
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.listeners.clear();
    this.pendingCallback = null;
  }
}

// Global runner singleton instance for browser tab
let globalRunnerInstance: PyodideRunner | null = null;

export function getGlobalPyodideRunner(): PyodideRunner {
  if (!globalRunnerInstance) {
    globalRunnerInstance = new PyodideRunner();
  }
  return globalRunnerInstance;
}
