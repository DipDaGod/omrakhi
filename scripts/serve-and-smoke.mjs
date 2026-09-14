/** Starts `astro preview`, runs tests/smoke.mjs against it, shuts it down. */
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const PORT = process.env.PORT ?? '4321';
const BASE = `http://localhost:${PORT}`;

const preview = spawn('npx', ['astro', 'preview', '--port', PORT], { stdio: 'ignore' });
const stop = () => { try { preview.kill(); } catch { /* already gone */ } };
process.on('exit', stop);
process.on('SIGINT', () => { stop(); process.exit(130); });

let up = false;
for (let i = 0; i < 40; i++) {
  try {
    const res = await fetch(BASE);
    if (res.ok) { up = true; break; }
  } catch { /* not listening yet */ }
  await sleep(250);
}
if (!up) {
  console.error(`Preview server did not come up on ${BASE}.`);
  stop();
  process.exit(1);
}

const smoke = spawn('node', ['tests/smoke.mjs'], {
  stdio: 'inherit',
  env: { ...process.env, SMOKE_BASE: BASE },
});
smoke.on('exit', (code) => { stop(); process.exit(code ?? 1); });
