import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const options = Object.fromEntries(process.argv.slice(2).map(value => {
  const split = value.indexOf('=');
  if (split < 0) throw new Error('Use --key=value arguments');
  return [value.slice(2, split), value.slice(split + 1)];
}));
if (!options.product || !options.output) throw new Error('Required: --product=path --output=new-directory [--vve=path]');
const product = path.resolve(options.product);
const output = path.resolve(options.output);
await mkdir(path.dirname(output), { recursive: true });
await mkdir(output); // Each attempt is immutable and never overwrites a previous run.
const core = await import(pathToFileURL(path.join(product, 'packages/core/dist/index.js')));
const cli = path.join(product, 'dist/palace.cjs');
const server = path.join(product, 'plugins/vertex-palace/mcp/server.cjs');
const protocol = JSON.parse(await readFile(new URL('../protocol/net-benefit-v1/protocol.json', import.meta.url)));
const count = protocol.engineeringGate.warmQueriesPerSample;
const result = { schemaVersion: 1, protocol: protocol.id, startedAt: new Date().toISOString(),
  environment: { node: process.version, platform: process.platform, arch: process.arch, cpus: os.cpus().length },
  artifacts: { cliSha256: hash(await readFile(cli)), mcpSha256: hash(await readFile(server)) },
  repeatCount: count, concurrency: 1, samples: [], complete: false, qualifies: false };
await persist();

async function run() {
try {
  for (const size of [1000, 10000]) {
    const root = path.join(output, `synthetic-${size}`);
    await mkdir(root);
    for (let i = 0; i < size; i += 1) {
      const previous = Math.max(0, i - 1);
      const source = i % 2 === 0
        ? `export function calculate${i}(value: number) { return value + ${i}; }\n`
        : `import { calculate${previous} } from './module-${previous}';\nexport function verify${i}() { return calculate${previous}(1); }\n`;
      await writeFile(path.join(root, `module-${i}.ts`), source);
    }
    await measureSample(`synthetic-${size}-files`, root, false);
  }
  if (options.vve) {
    const root = path.join(output, 'private-vve-snapshot');
    await mkdir(root);
    const scan = await core.scanRepo({ root: path.resolve(options.vve), includeHidden: true, hashMode: 'full' });
    for (const file of scan.files) {
      const destination = path.join(root, file.path);
      await mkdir(path.dirname(destination), { recursive: true });
      await copyFile(path.join(options.vve, file.path), destination);
      if (await core.hashFile(destination) !== file.hash) throw new Error('Private source changed during snapshot; preserve this incomplete attempt.');
    }
    await writeFile(path.join(output, 'private-manifest.local.json'), JSON.stringify(scan.files, null, 2));
    await measureSample('private-vve-performance-snapshot', root, true);
  }
  result.complete = result.samples.length === protocol.engineeringGate.samples.length;
  result.qualifies = result.complete && result.samples.every(sample => sample.queries.every(query => query.pass));
} catch (error) {
  result.error = { name: error.name, message: String(error.message).replaceAll(output, '[run-directory]').replaceAll(product, '[product]') };
  process.exitCode = 1;
} finally {
  result.finishedAt = new Date().toISOString();
  await persist();
}
}

async function measureSample(id, root, privateSample) {
  const sample = { id, private: privateSample, queries: [] };
  result.samples.push(sample);
  const cold = await command(['index', '--root', root, '--full']);
  const indexOutput = JSON.parse(cold.stdout);
  sample.coldIndex = { wallMs: cold.ms, phases: indexOutput.phaseTimingsMs, fileCount: indexOutput.fileCount,
    nodeCount: indexOutput.nodeCount, parsed: indexOutput.parsedFileCount, reused: indexOutput.reusedFileCount };
  const indexed = await core.readIndex(root);
  const file = indexed.nodes.find(node => node.language === 'typescript' && !node.startLine && node.kind !== 'directory')
    ?? indexed.nodes.find(node => !node.startLine && node.kind !== 'directory');
  const symbol = indexed.nodes.find(node => node.startLine && node.kind === 'function') ?? file;
  if (!file || !symbol) throw new Error('Sample has no file/symbol query candidates');
  await core.writeMemory({ root, task: 'Synthetic retention contract', outcome: 'success',
    changedFiles: [file.sourcePath], decisions: ['Synthetic retention must remain local to this sample.'],
    pitfalls: ['Do not use synthetic retention notes as another project constraint.'] });
  const queries = [
    { id: 'path', tool: 'palace_lookup', args: { query: file.sourcePath }, cli: ['lookup', file.sourcePath] },
    { id: 'qualified-symbol', tool: 'palace_lookup', args: { query: symbol.object?.qualifiedName ?? symbol.title }, cli: ['lookup', symbol.object?.qualifiedName ?? symbol.title] },
    { id: 'symbol', tool: 'palace_lookup', args: { query: symbol.title }, cli: ['lookup', symbol.title] },
    { id: 'lexical', tool: 'palace_lookup', args: { query: `${symbol.title} implementation` }, cli: ['lookup', `${symbol.title} implementation`] },
    { id: 'neighbors', tool: 'palace_lookup', args: { operation: 'neighbors', nodeId: file.id }, cli: ['lookup', '--neighbors', file.id] },
    { id: 'memory', tool: 'palace_memory_search', args: { task: 'Synthetic retention contract' }, cli: ['memory', 'search', 'Synthetic retention contract'] },
    { id: 'miss', tool: 'palace_lookup', args: { query: 'zzqnomatchzzq' }, cli: ['lookup', 'zzqnomatchzzq'] }
  ];
  const mcp = new Client(server);
  try {
    const start = performance.now();
    await mcp.request('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'net-benefit-perf', version: '1' } });
    sample.mcpStartupMs = performance.now() - start;
    for (const query of queries) {
      const data = { id: query.id, cliMs: [], mcpMs: [], outputsWithinBudget: true, deterministic: true };
      sample.queries.push(data);
      let expected;
      await mcp.call(query.tool, { root, ...query.args }); // First query is separately warm-up, not an observed warm repetition.
      for (let repeat = 0; repeat < count; repeat += 1) {
        const observed = await command([...query.cli, '--root', root]);
        const body = JSON.parse(observed.stdout);
        data.cliMs.push(observed.ms);
        const began = performance.now();
        const rpc = await mcp.call(query.tool, { root, ...query.args });
        data.mcpMs.push(performance.now() - began);
        const signature = hash(JSON.stringify(body));
        expected ??= signature;
        data.deterministic &&= signature === expected && hash(JSON.stringify(rpc)) === expected;
        const ceiling = query.id === 'miss' ? 100 : query.id === 'memory' ? 600 : 1000;
        data.outputsWithinBudget &&= body.advisory === true && rpc.advisory === true
          && core.estimateTokens(JSON.stringify(body, null, 2)) === body.estimatedTokens && body.estimatedTokens <= ceiling;
        if (repeat % 10 === 9) await persist();
      }
      data.cliP95Ms = p95(data.cliMs);
      data.mcpP95Ms = p95(data.mcpMs);
      data.pass = data.cliP95Ms <= protocol.engineeringGate.cliP95Ms && data.mcpP95Ms <= protocol.engineeringGate.mcpP95Ms
        && data.outputsWithinBudget && data.deterministic;
      process.stdout.write(JSON.stringify({ sample: id, query: query.id, cliP95Ms: data.cliP95Ms, mcpP95Ms: data.mcpP95Ms, pass: data.pass }) + '\n');
      await persist();
    }
  } finally { await mcp.close(); }
  const warm = await command(['index', '--root', root]);
  const warmBody = JSON.parse(warm.stdout);
  sample.unchangedRebuild = { wallMs: warm.ms, phases: warmBody.phaseTimingsMs, parsed: warmBody.parsedFileCount, reused: warmBody.reusedFileCount };
  const change = path.join(root, 'net-benefit-refresh-probe.ts');
  await writeFile(change, 'export const refreshProbe = true;\n');
  const refreshed = await command(['index', '--root', root]);
  const refreshedBody = JSON.parse(refreshed.stdout);
  sample.changedRefresh = { wallMs: refreshed.ms, phases: refreshedBody.phaseTimingsMs, parsed: refreshedBody.parsedFileCount, reused: refreshedBody.reusedFileCount };
  await persist();
}

function command(args) {
  return new Promise((resolve, reject) => {
    const started = performance.now();
    const child = spawn(process.execPath, [cli, ...args], { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, VERTEX_PALACE_EXPERIMENTAL_ROOM_INVENTORY: '1' } });
    let stdout = '', stderr = '';
    const timeout = setTimeout(() => { child.kill(); reject(new Error('Engineering command exceeded 10 minutes')); }, 600000);
    child.stdout.on('data', chunk => { stdout += chunk; }); child.stderr.on('data', chunk => { stderr += chunk; });
    child.on('error', error => { clearTimeout(timeout); reject(error); });
    child.on('close', code => { clearTimeout(timeout); code === 0 ? resolve({ stdout, ms: performance.now() - started }) : reject(new Error(stderr || `CLI exit ${code}`)); });
  });
}
function hash(value) { return createHash('sha256').update(value).digest('hex'); }
function p95(values) { return [...values].sort((a, b) => a - b)[Math.ceil(values.length * 0.95) - 1]; }
async function persist() { await writeFile(path.join(output, 'performance.public.json'), JSON.stringify(result, null, 2) + '\n'); }

class Client {
  constructor(serverPath) {
    this.child = spawn(process.execPath, [serverPath, '--stdio'], { windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, VERTEX_PALACE_EXPERIMENTAL_LIGHTWEIGHT: 'navigation', VERTEX_PALACE_EXPERIMENTAL_ROOM_INVENTORY: '1' } });
    this.buffer = Buffer.alloc(0); this.pending = new Map(); this.id = 0;
    this.closed = new Promise(resolve => this.child.once('close', resolve));
    this.child.stdout.on('data', chunk => {
      this.buffer = Buffer.concat([this.buffer, chunk]);
      while (true) {
        const split = this.buffer.indexOf('\r\n\r\n'); if (split < 0) break;
        const length = Number(/Content-Length:\s*(\d+)/i.exec(this.buffer.subarray(0, split).toString())?.[1]);
        if (!Number.isFinite(length) || this.buffer.length < split + 4 + length) break;
        const message = JSON.parse(this.buffer.subarray(split + 4, split + 4 + length).toString());
        this.buffer = this.buffer.subarray(split + 4 + length);
        const pending = this.pending.get(message.id); if (!pending) continue;
        this.pending.delete(message.id); clearTimeout(pending.timer);
        message.error ? pending.reject(new Error(message.error.message)) : pending.resolve(message.result);
      }
    });
    this.child.on('error', error => this.fail(error));
    this.child.on('close', () => this.fail(new Error('MCP closed before response')));
    this.child.stderr.resume();
  }
  fail(error) { for (const value of this.pending.values()) { clearTimeout(value.timer); value.reject(error); } this.pending.clear(); }
  request(method, params) {
    return new Promise((resolve, reject) => {
      const id = ++this.id;
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error('MCP query exceeded 10 minutes')); }, 600000);
      this.pending.set(id, { resolve, reject, timer });
      const body = JSON.stringify({ jsonrpc: '2.0', id, method, params });
      this.child.stdin.write(`Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`);
    });
  }
  async call(name, args) { const value = await this.request('tools/call', { name, arguments: args }); return JSON.parse(value.content[0].text); }
  async close() { this.child.stdin.end(); this.child.kill(); await this.closed; }
}
await run();
