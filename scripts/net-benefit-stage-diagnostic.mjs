import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, copyFile, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const [productArgument, frozenAttemptArgument, outputArgument] = process.argv.slice(2);
if (!productArgument || !frozenAttemptArgument || !outputArgument) throw new Error('Usage: <product> <frozen-vve-attempt> <new-output-directory>');
const product = path.resolve(productArgument), frozenAttempt = path.resolve(frozenAttemptArgument), output = path.resolve(outputArgument);
await mkdir(output);
const root = path.join(output, 'snapshot');
await mkdir(root);
const manifestBytes = await readFile(path.join(frozenAttempt, 'private-manifest.local.json'));
const manifest = JSON.parse(manifestBytes);
for (let offset = 0; offset < manifest.length; offset += 16) {
  const batch = await Promise.allSettled(manifest.slice(offset, offset + 16).map(async file => {
    if (path.isAbsolute(file.path) || path.relative(root, path.resolve(root, file.path)).startsWith('..')) throw new Error('Invalid snapshot path');
    const destination = path.join(root, file.path);
    await mkdir(path.dirname(destination), { recursive: true });
    await copyFile(path.join(frozenAttempt, 'private-vve-snapshot', file.path), destination);
    if (hash(await readFile(destination)) !== file.hash) throw new Error('Frozen snapshot checksum mismatch');
  }));
  const failed = batch.find(item => item.status === 'rejected');
  if (failed) throw failed.reason;
}
const cli = path.join(product, 'dist/palace.cjs');
const result = { diagnosticOnly: true, qualificationEvidence: false, sourceManifestSha256: hash(manifestBytes),
  cliSha256: hash(await readFile(cli)), timeoutMs: 90000, events: [], completed: false };
const start = performance.now();
const child = spawn(process.execPath, [cli, 'index', '--root', root, '--full'], { windowsHide: true,
  env: { ...process.env, VERTEX_PALACE_EXPERIMENTAL_ROOM_INVENTORY: '1' }, stdio: ['ignore', 'pipe', 'pipe'] });
let stdout = '', stderr = '';
child.stdout.on('data', chunk => { stdout += chunk; }); child.stderr.on('data', chunk => { stderr += chunk; });
const timer = setTimeout(() => { result.stoppedAtDiagnosticLimit = true; child.kill(); }, result.timeoutMs);
const poll = setInterval(async () => {
  const state = await readProgress();
  if (state && JSON.stringify(state) !== JSON.stringify(result.events.at(-1))) result.events.push(state);
}, 2000);
const exitCode = await new Promise((resolve, reject) => { child.once('close', resolve); child.once('error', reject); });
clearTimeout(timer); clearInterval(poll);
const last = await readProgress();
if (last && JSON.stringify(last) !== JSON.stringify(result.events.at(-1))) result.events.push(last);
result.wallMs = performance.now() - start;
result.exitCode = exitCode;
result.completed = exitCode === 0;
if (result.completed) {
  const value = JSON.parse(stdout);
  result.phases = value.phaseTimingsMs;
}
await writeFile(path.join(output, 'stderr.local.txt'), stderr);
await writeFile(path.join(output, 'diagnostic.public.json'), JSON.stringify(result, null, 2) + '\n');
process.stdout.write(JSON.stringify(result, null, 2) + '\n');

async function readProgress() {
  try { const { pid, ...state } = JSON.parse(await readFile(path.join(root, '.palace/cache/index-progress.json'), 'utf8')); return state; }
  catch { return null; }
}
function hash(value) { return createHash('sha256').update(value).digest('hex'); }
