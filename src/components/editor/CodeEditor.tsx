"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePyodide } from "@/lib/execution/usePyodide";
import { TestCase } from "@/lib/content/schemas";

// Dynamically import Monaco Editor to keep it off initial bundles and SSR
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 items-center justify-center bg-[var(--editor-bg)] text-xs text-[var(--editor-comment)] font-mono">
      Loading Monaco Editor...
    </div>
  ),
});

export interface CodeEditorProps {
  initialCode: string;
  tests?: TestCase[];
  onCodeChange?: (code: string) => void;
  onRunComplete?: (passedAll: boolean) => void;
  title?: string;
}

export function CodeEditor({
  initialCode,
  tests = [],
  onCodeChange,
  onRunComplete,
  title = "Python Code Editor",
}: CodeEditorProps) {
  const [code, setCode] = useState<string>(initialCode);
  const [useMonaco, setUseMonaco] = useState<boolean>(true);
  const [isLargeScreen, setIsLargeScreen] = useState<boolean>(true);

  const {
    runtimeStatus,
    statusMessage,
    isExecuting,
    executionResult,
    runCode,
    cancelRun,
    resetResult,
  } = usePyodide();

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Responsive check for 1024px viewport
  useEffect(() => {
    const checkViewport = () => {
      const isLg = window.innerWidth >= 1024;
      setIsLargeScreen(isLg);
    };

    checkViewport();
    window.addEventListener("resize", checkViewport);
    return () => window.removeEventListener("resize", checkViewport);
  }, []);

  const handleCodeChange = (newVal: string) => {
    setCode(newVal);
    onCodeChange?.(newVal);
  };

  const handleRun = async () => {
    const res = await runCode(code, tests);
    if (res.testResults.length > 0) {
      const passedAll = res.testResults.every((t) => t.passed);
      onRunComplete?.(passedAll);
    }
  };

  const handleReset = () => {
    setCode(initialCode);
    resetResult();
    onCodeChange?.(initialCode);
  };

  // Determine if Monaco should be active
  const showMonaco = useMonaco && isLargeScreen;

  return (
    <div className="flex flex-col rounded-[var(--radius-lg)] border border-[var(--stone-200)] bg-white shadow-[var(--shadow-card)] overflow-hidden">
      {/* Editor Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--stone-200)] bg-[var(--stone-100)] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[var(--stone-800)]">{title}</span>
          {runtimeStatus === "loading" && (
            <Badge variant="warning" className="animate-pulse">
              {statusMessage || "Loading Python..."}
            </Badge>
          )}
          {runtimeStatus === "ready" && (
            <Badge variant="mint">Python 3.12 Ready</Badge>
          )}
          {runtimeStatus === "error" && (
            <Badge variant="coral">Runtime Error</Badge>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Mode toggle */}
          <button
            type="button"
            onClick={() => setUseMonaco(!useMonaco)}
            className="text-xs text-[var(--stone-600)] hover:text-[var(--stone-900)] underline cursor-pointer px-1.5 py-1"
            title="Toggle between Monaco and lightweight textarea"
          >
            {showMonaco ? "Switch to Textarea" : "Switch to Monaco"}
          </button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleReset}
            disabled={isExecuting}
          >
            Reset
          </Button>

          {isExecuting ? (
            <Button
              variant="accent"
              size="sm"
              onClick={cancelRun}
            >
              Stop ⏹
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={handleRun}
              disabled={runtimeStatus === "loading"}
            >
              Run Code ▶
            </Button>
          )}
        </div>
      </div>

      {/* Editor Surface */}
      <div className="relative min-h-[260px] bg-[var(--editor-bg)]">
        {showMonaco ? (
          <div>
            <div className="bg-[var(--editor-bg)] px-3 py-1 text-[11px] text-[var(--editor-comment)] border-b border-slate-800 flex justify-between">
              <span>Python Mode (Press <kbd className="rounded bg-slate-800 px-1 text-slate-300">Esc</kbd> then <kbd className="rounded bg-slate-800 px-1 text-slate-300">Tab</kbd> to exit editor focus)</span>
              <span>Monaco Active</span>
            </div>
            <MonacoEditor
              height="280px"
              language="python"
              theme="vs-dark"
              value={code}
              onChange={(v) => handleCodeChange(v || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
                wordWrap: "on",
                ariaLabel: "Python Code Editor",
              }}
            />
          </div>
        ) : (
          <div className="p-3">
            <div className="mb-2 text-[11px] text-[var(--editor-comment)] flex justify-between">
              <span>Accessible Monospace Textarea</span>
              <span>Standard Tab Navigation Enabled</span>
            </div>
            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              aria-label="Python Code Editor"
              rows={12}
              className="w-full rounded-[var(--radius-sm)] bg-slate-900 font-mono text-sm text-[var(--editor-text)] p-3 outline-none focus:ring-2 focus:ring-[var(--mint-500)] resize-y leading-relaxed"
              spellCheck={false}
            />
          </div>
        )}
      </div>

      {/* Output & Test Results Panel */}
      <div className="border-t border-[var(--stone-200)] bg-[var(--stone-50)] p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--stone-700)]">
            Execution Console
          </span>
          {executionResult && (
            <span className="text-xs text-[var(--stone-500)]">
              Execution took {executionResult.durationMs} ms
            </span>
          )}
        </div>

        {/* Empty state before running */}
        {!executionResult && !isExecuting && (
          <div className="rounded-[var(--radius-sm)] border border-[var(--stone-200)] bg-white p-3 text-xs text-[var(--stone-500)] font-mono italic">
            Click &quot;Run Code ▶&quot; to execute your solution in the browser.
          </div>
        )}

        {/* Executing state */}
        {isExecuting && (
          <div className="rounded-[var(--radius-sm)] border border-[var(--mint-300)] bg-[var(--mint-50)] p-3 text-xs text-[var(--mint-950)] font-mono animate-pulse">
            Executing code in Web Worker...
          </div>
        )}

        {/* Results view */}
        {executionResult && !isExecuting && (
          <div className="space-y-3" aria-live="polite">
            {/* Standard Output */}
            {executionResult.stdout && (
              <div>
                <span className="text-[11px] font-bold text-[var(--stone-600)] block mb-1">
                  Standard Output (stdout):
                </span>
                <div className="rounded-[var(--radius-sm)] bg-[var(--editor-bg)] p-3 font-mono text-xs text-emerald-400 overflow-x-auto whitespace-pre-wrap">
                  {executionResult.stdout}
                </div>
              </div>
            )}

            {/* Error or Traceback */}
            {executionResult.status === "error" && (
              <div className="rounded-[var(--radius-sm)] border border-rose-300 bg-rose-50 p-3 text-xs text-rose-950">
                <div className="font-bold mb-1 flex items-center gap-1.5 text-rose-800">
                  <span>⚠ Python Runtime Error</span>
                </div>
                {executionResult.friendlyError && (
                  <p className="mb-2 font-medium bg-rose-100/70 p-2 rounded text-rose-900">
                    💡 {executionResult.friendlyError}
                  </p>
                )}
                {executionResult.traceback && (
                  <pre className="font-mono text-[11px] text-rose-800 overflow-x-auto whitespace-pre-wrap bg-rose-100/40 p-2 rounded">
                    {executionResult.traceback}
                  </pre>
                )}
              </div>
            )}

            {/* Timeout State */}
            {executionResult.status === "timeout" && (
              <div className="rounded-[var(--radius-sm)] border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950">
                <span className="font-bold block mb-1">⏱ Execution Timeout (5s)</span>
                <p>{executionResult.friendlyError}</p>
                <p className="mt-1 text-[11px] text-amber-800">
                  The Python worker was terminated and restarted automatically.
                </p>
              </div>
            )}

            {/* Test Case Checks */}
            {executionResult.testResults.length > 0 && (
              <div className="mt-4 pt-3 border-t border-[var(--stone-200)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[var(--stone-800)]">
                    Test Results ({executionResult.testResults.filter((t) => t.passed).length}/{executionResult.testResults.length} Passed)
                  </span>
                  <span className="text-[11px] text-[var(--stone-500)]">
                    Tier A Practice Check
                  </span>
                </div>

                <div className="space-y-2.5">
                  {executionResult.testResults.map((t, idx) => (
                    <div
                      key={idx}
                      className={`rounded-[var(--radius-sm)] border p-3 text-xs font-mono flex flex-col gap-1.5 ${
                        t.passed
                          ? "border-emerald-300 bg-emerald-50 text-emerald-950"
                          : "border-rose-300 bg-rose-50 text-rose-950"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold flex items-center gap-1.5">
                          <span>{t.passed ? "✓ PASS:" : "✗ FAIL:"}</span>
                          <span>{t.name}</span>
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            t.passed
                              ? "bg-emerald-200/70 text-emerald-900"
                              : "bg-rose-200/70 text-rose-900"
                          }`}
                        >
                          {t.passed ? "Passed" : "Failed"}
                        </span>
                      </div>

                      {!t.passed && (
                        <div className="text-[11px] text-rose-900 mt-1 pl-3 border-l-2 border-rose-400 space-y-1.5">
                          {t.diagnosticHint && (
                            <div className="font-sans font-medium text-rose-900 bg-rose-100/80 p-2 rounded border border-rose-200">
                              💡 {t.diagnosticHint}
                            </div>
                          )}
                          {t.feedbackOnFail && (
                            <p className="font-sans font-semibold text-rose-950">
                              {t.feedbackOnFail}
                            </p>
                          )}
                          <div className="bg-white/80 p-2 rounded border border-rose-200 font-mono text-[11px] space-y-0.5">
                            <div>
                              <span className="text-[var(--stone-500)] font-sans">Expected: </span>
                              <span className="font-bold text-emerald-800">
                                {JSON.stringify(t.expected)}
                              </span>
                              {t.expectedType && (
                                <span className="text-[10px] text-[var(--stone-500)] ml-1 font-sans">
                                  ({t.expectedType})
                                </span>
                              )}
                            </div>
                            <div>
                              <span className="text-[var(--stone-500)] font-sans">Received: </span>
                              <span className="font-bold text-rose-800">
                                {typeof t.actual === "object" ? JSON.stringify(t.actual) : String(t.actual)}
                              </span>
                              {t.actualType && (
                                <span className="text-[10px] text-[var(--stone-500)] ml-1 font-sans">
                                  ({t.actualType})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
