import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { ROOT } from '../machine/config.ts';
import { json } from '../machine/validator.ts';
import { buildDirectories, buildName } from '../machine/storage.ts';
import { compareEvents } from '../machine/decoder.ts';
import type { TraceEvent } from '../machine/decoder.ts';

const changes = execFileSync('git', ['diff', '--cached', '--relative', '--name-only', '--', 'live', 'builds', 'README.md'], { cwd: ROOT, encoding: 'utf8' }).trim().split('\n');
const onlyCheckpoint = changes.every(path => path === 'live/state.json' || path === 'README.md');
const live = json<TraceEvent[]>(join(ROOT, 'live/trace.json'));
const lastBuild = buildDirectories(join(ROOT, 'builds')).at(-1);
const sealed = lastBuild ? json<TraceEvent[]>(join(ROOT, 'builds', lastBuild, 'trace.json')) : [];
const last = [...sealed, ...live].filter(event => ['WRITE', 'EDIT', 'SEAL'].includes(event.type)).sort(compareEvents).at(-1);
if (onlyCheckpoint) console.log(`pool: sync finalized block ${json<{ lastProcessedBlock: number }>(join(ROOT, 'live/state.json')).lastProcessedBlock}`);
else if (last?.type === 'SEAL') console.log(`build: seal #${buildName(last.buildId!)}`);
else if (last?.type === 'WRITE') console.log(`pool: append ${last.opcode}/${String(last.index).padStart(2, '0')}`);
else if (last?.type === 'EDIT') console.log(`pool: edit ${last.edit}/${String(last.index).padStart(2, '0')}`);
else console.log('pool: sync finalized state');
