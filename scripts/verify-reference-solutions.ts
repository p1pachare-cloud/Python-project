import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { ChallengeSchema, type Challenge } from "../src/lib/content/schemas.ts";

const CONTENT_ROOT = path.join(process.cwd(), "content");

interface ChallengeVerifyResult {
  slug: string;
  title: string;
  totalTests: number;
  passedTests: number;
  passed: boolean;
  errors: string[];
}

const PYTHON_HARNESS = `
import json, sys, math, io

raw_input = sys.stdin.read()
payload = json.loads(raw_input)
code = payload["code"]
tests = payload["tests"]

def is_approx_equal(actual, expected, tol=1e-4):
    if actual == expected:
        return True
    if isinstance(actual, (int, float)) and isinstance(expected, (int, float)):
        return math.isclose(float(actual), float(expected), abs_tol=tol)
    if isinstance(actual, list) and isinstance(expected, list):
        if len(actual) != len(expected):
            return False
        return all(is_approx_equal(a, b, tol) for a, b in zip(actual, expected))
    if isinstance(actual, dict) and isinstance(expected, dict):
        if len(actual) != len(expected):
            return False
        return all(k in actual and is_approx_equal(actual[k], expected[k], tol) for k in expected)
    return False

# Execute solution in isolated namespace
ns = {}
exec(code, ns)

results = []
for idx, t in enumerate(tests):
    kind = t.get("kind")
    if kind == "stdout":
        # Capture stdout
        old_stdout = sys.stdout
        sys.stdout = io.StringIO()
        try:
            exec(code, ns)
            output = sys.stdout.getvalue()
        finally:
            sys.stdout = old_stdout
        
        expected = t["expected"]
        compare = t.get("compare", "trimmed")
        if compare == "exact":
            passed = output == expected
        else:
            passed = output.strip() == expected.strip()
        results.append({"index": idx, "passed": passed, "actual": output, "expected": expected})

    elif kind == "call":
        fn_name = t["fn"]
        if fn_name not in ns:
            results.append({"index": idx, "passed": False, "error": f"Function '{fn_name}' not defined"})
            continue
        
        fn = ns[fn_name]
        args = t.get("args", [])
        expected = t["expected"]
        compare = t.get("compare", "equal")
        tolerance = float(t.get("tolerance", 0.0001))

        try:
            actual = fn(*args)
            if compare == "approx":
                passed = is_approx_equal(actual, expected, tolerance)
            else:
                passed = (actual == expected)
            results.append({"index": idx, "passed": passed, "actual": actual, "expected": expected})
        except Exception as exc:
            results.append({"index": idx, "passed": False, "error": str(exc)})

print(json.dumps(results))
`;

function runVerification(): void {
  console.log("=== PyQuest Automated Reference Solution Verification ===");
  console.log(`Searching for challenges in: ${CONTENT_ROOT}\n`);

  const challengeFiles = findChallengeFiles(CONTENT_ROOT);
  console.log(`Found ${challengeFiles.length} challenge specification(s).\n`);

  if (challengeFiles.length === 0) {
    console.error("ERROR: No challenge files found!");
    process.exit(1);
  }

  const results: ChallengeVerifyResult[] = [];
  let allPassed = true;

  for (const filePath of challengeFiles) {
    const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const challenge: Challenge = ChallengeSchema.parse(raw);

    const result: ChallengeVerifyResult = {
      slug: challenge.slug,
      title: challenge.title,
      totalTests: challenge.visibleTests.length + challenge.additionalChecks.length,
      passedTests: 0,
      passed: false,
      errors: [],
    };

    if (!challenge.referenceSolution || !challenge.referenceSolution.trim()) {
      result.errors.push("Missing or empty referenceSolution");
      allPassed = false;
      results.push(result);
      continue;
    }

    const allTests = [...challenge.visibleTests, ...challenge.additionalChecks];
    const payload = JSON.stringify({
      code: challenge.referenceSolution,
      tests: allTests,
    });

    const py = spawnSync("python", ["-c", PYTHON_HARNESS], {
      input: payload,
      encoding: "utf-8",
    });

    if (py.error || py.status !== 0) {
      result.errors.push(`Python execution failed: ${py.stderr || py.error?.message}`);
      allPassed = false;
      results.push(result);
      continue;
    }

    try {
      const testResults = JSON.parse(py.stdout.trim());
      let passedCount = 0;
      for (const tr of testResults) {
        if (tr.passed) {
          passedCount++;
        } else {
          result.errors.push(
            `Test ${tr.index + 1} failed: ${tr.error || `Expected ${JSON.stringify(tr.expected)}, got ${JSON.stringify(tr.actual)}`}`
          );
        }
      }

      result.passedTests = passedCount;
      result.passed = passedCount === allTests.length;
      if (!result.passed) {
        allPassed = false;
      }
    } catch (parseErr: unknown) {
      result.errors.push(`Failed to parse Python test output: ${(parseErr as Error).message}`);
      allPassed = false;
    }

    results.push(result);
  }

  // Also execute a negative test: verify that a faulty solution fails the test suite
  const negativeTestPassed = runNegativeVerification();
  if (!negativeTestPassed) {
    allPassed = false;
  }

  // Print Summary Table
  console.log("---------------------------------------------------------------------------------");
  console.log("Challenge Slug                  | Difficulty | Tests Passed | Status");
  console.log("---------------------------------------------------------------------------------");
  for (const r of results) {
    const status = r.passed ? "✅ PASS" : "❌ FAIL";
    console.log(
      `${r.slug.padEnd(31)} | ${r.passedTests}/${r.totalTests} tests passed | ${status}`
    );
    if (r.errors.length > 0) {
      for (const err of r.errors) {
        console.error(`   -> ${err}`);
      }
    }
  }
  console.log("---------------------------------------------------------------------------------");

  if (!allPassed) {
    console.error("\n❌ Reference solution verification failed. Fix broken solutions or tests before proceeding.");
    process.exit(1);
  }

  console.log(`\n✅ All ${results.length} challenges passed 100% of reference solution checks & negative tests!`);
}

function runNegativeVerification(): boolean {
  // Test that an incorrect solution (e.g. returning subtraction for add_numbers) actually fails
  const faultyPayload = JSON.stringify({
    code: "def add_numbers(a, b):\n    return a - b\n",
    tests: [{ kind: "call", fn: "add_numbers", args: [3, 5], expected: 8 }],
  });

  const py = spawnSync("python", ["-c", PYTHON_HARNESS], {
    input: faultyPayload,
    encoding: "utf-8",
  });

  try {
    const res = JSON.parse(py.stdout.trim());
    if (res[0].passed === false) {
      console.log("Verified negative test: faulty implementation correctly failed test harness.");
      return true;
    }
    console.error("Negative test failed: faulty implementation unexpectedly passed!");
    return false;
  } catch {
    console.error("Negative test failed to execute.");
    return false;
  }
}

function findChallengeFiles(dir: string): string[] {
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findChallengeFiles(fullPath));
    } else if (entry.name.endsWith(".challenge.json")) {
      results.push(fullPath);
    }
  }
  return results;
}

runVerification();
