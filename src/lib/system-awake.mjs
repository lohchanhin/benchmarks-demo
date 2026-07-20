import { spawn } from "node:child_process";

const READY_PREFIX = "VERTEX_BENCHMARK_AWAKE_READY:";
const POWERSHELL_SCRIPT = [
  "$ErrorActionPreference = 'Stop'",
  "$member = '[System.Runtime.InteropServices.DllImport(\"kernel32.dll\")] public static extern uint SetThreadExecutionState(uint esFlags);'",
  "Add-Type -MemberDefinition $member -Name NativePower -Namespace VertexBenchmark",
  "$flags = [uint32]::Parse('2147483649')",
  "$previous = [VertexBenchmark.NativePower]::SetThreadExecutionState($flags)",
  "if ($previous -eq 0) { throw 'SetThreadExecutionState failed' }",
  `[Console]::Out.WriteLine("${READY_PREFIX}" + $previous)`,
  "[Console]::Out.Flush()",
  "try { $null = [Console]::In.ReadLine() } finally { $null = [VertexBenchmark.NativePower]::SetThreadExecutionState([uint32]::Parse('2147483648')) }"
].join("; ");

export async function startSystemAwake(options = {}) {
  if (process.platform !== "win32") {
    return {
      active: false,
      method: "unsupported-platform",
      async stop() {
        return { stopped: true, exitCode: null, stderr: "" };
      }
    };
  }

  const child = spawn(
    options.powershell ?? "powershell.exe",
    ["-NoLogo", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", POWERSHELL_SCRIPT],
    { windowsHide: true, stdio: ["pipe", "pipe", "pipe"] }
  );
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  let stdout = "";
  let stderr = "";
  let ready = false;
  const closed = new Promise((resolve) => child.once("close", (code) => resolve(code ?? 1)));
  const startup = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("System-awake helper did not become ready")), options.timeoutMs ?? 10_000);
    child.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
      if (!ready && new RegExp(`${READY_PREFIX}[1-9][0-9]*`).test(stdout)) {
        ready = true;
        clearTimeout(timeout);
        resolve();
      }
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.once("close", (code) => {
      if (!ready) {
        clearTimeout(timeout);
        reject(new Error(`System-awake helper exited before ready (${code ?? 1}): ${stderr.trim()}`));
      }
    });
  });

  try {
    await startup;
  } catch (error) {
    child.kill();
    throw error;
  }

  let stopped = false;
  return {
    active: true,
    method: "windows-set-thread-execution-state-system-required",
    displayRequired: false,
    async stop() {
      if (stopped) return { stopped: true, exitCode: await closed, stderr: stderr.trim() };
      stopped = true;
      child.stdin.end("stop\n");
      let stopTimer;
      const exitCode = await Promise.race([
        closed,
        new Promise((resolve) => {
          stopTimer = setTimeout(() => {
            child.kill();
            resolve(null);
          }, options.stopTimeoutMs ?? 5_000);
        })
      ]);
      clearTimeout(stopTimer);
      return { stopped: true, exitCode, stderr: stderr.trim() };
    }
  };
}
