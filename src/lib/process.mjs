import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export async function runProcess(command, args = [], options = {}) {
  const startedAt = new Date();
  const started = performance.now();
  const invocation = windowsInvocation(command, args, options.windowsShim);
  const environment = { ...process.env, ...options.env };
  for (const key of options.unsetEnv ?? []) delete environment[key];
  const child = spawn(invocation.command, invocation.args, {
    cwd: options.cwd,
    env: environment,
    shell: false,
    windowsHide: true,
    stdio: ["pipe", "pipe", "pipe"]
  });

  let stdout = "";
  let stderr = "";
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk) => {
    stdout += chunk;
    if (options.echo) process.stdout.write(chunk);
  });
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
    if (options.echo) process.stderr.write(chunk);
  });

  if (options.input !== undefined) child.stdin.end(options.input);
  else child.stdin.end();

  const exitCode = await new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("close", (code) => resolve(code ?? 1));
  });

  const result = {
    command,
    args,
    cwd: options.cwd,
    startedAt: startedAt.toISOString(),
    endedAt: new Date().toISOString(),
    durationMs: Math.round(performance.now() - started),
    exitCode,
    stdout,
    stderr
  };

  if (options.stdoutPath) {
    await mkdir(path.dirname(options.stdoutPath), { recursive: true });
    await writeFile(options.stdoutPath, stdout, "utf8");
  }
  if (options.stderrPath) {
    await mkdir(path.dirname(options.stderrPath), { recursive: true });
    await writeFile(options.stderrPath, stderr, "utf8");
  }

  if (options.check && exitCode !== 0) {
    const detail = stderr.trim() || stdout.trim() || `exit code ${exitCode}`;
    throw new Error(`${command} failed: ${detail}`);
  }
  return result;
}

function windowsInvocation(command, args, useShim) {
  if (process.platform !== "win32" || !useShim) return { command, args };
  const executable = /^[a-z0-9._-]+$/i.test(command) ? command : quoteCmdArgument(command);
  const commandLine = [executable, ...args.map(quoteCmdArgument)].join(" ");
  return {
    command: process.env.ComSpec || "cmd.exe",
    args: ["/d", "/c", commandLine]
  };
}

function quoteCmdArgument(value) {
  const text = String(value);
  if (!/[\s"&|<>^()%!]/.test(text)) return text;
  return `"${text.replaceAll('"', '""')}"`;
}
