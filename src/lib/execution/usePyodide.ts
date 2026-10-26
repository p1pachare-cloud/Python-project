"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  getGlobalPyodideRunner,
  ExecutionResult,
  WorkerRuntimeStatus,
} from "./pyodideRunner";
import { TestCase } from "@/lib/content/schemas";

export function usePyodide() {
  const runnerRef = useRef(getGlobalPyodideRunner());
  const [runtimeStatus, setRuntimeStatus] = useState<WorkerRuntimeStatus>("unloaded");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);

  useEffect(() => {
    const runner = runnerRef.current;
    runner.ensureWorker();

    const unsubscribe = runner.subscribe({
      onStatusChange: (status, message) => {
        setRuntimeStatus(status);
        setStatusMessage(message || "");
      },
      onExecutionResult: (res) => {
        setExecutionResult(res);
        setIsExecuting(false);
      },
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const runCode = useCallback(
    async (
      code: string,
      tests: TestCase[] = [],
      stdin: string = "",
      timeoutMs: number = 5000
    ): Promise<ExecutionResult> => {
      setIsExecuting(true);
      const runner = runnerRef.current;
      const res = await runner.run(code, tests, stdin, timeoutMs);
      return res;
    },
    []
  );

  const cancelRun = useCallback(() => {
    runnerRef.current.cancel();
    setIsExecuting(false);
  }, []);

  const resetResult = useCallback(() => {
    setExecutionResult(null);
  }, []);

  return {
    runtimeStatus,
    statusMessage,
    isExecuting,
    executionResult,
    runCode,
    cancelRun,
    resetResult,
  };
}
