import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { LIVE_START, LIVE_END, updateReadme } from '../machine/readme.ts';
import { publish } from '../machine/storage.ts';
import { ADDRESS, BLOCK, BLOCK_HASH, sealedFixture } from './fixture.ts';

function temporary(fn: (root: string) => void): void {
  const root = mkdtempSync(join(tmpdir(), 'autogithub-readme-'));
  try { fn(root); } finally { rmSync(root, { recursive: true, force: true }); }
}
const prose = `![AUTOCOMMIT](banner.png)\n\n# AUTOCOMMIT\n\nThe pool is writing something.\n\n${LIVE_START}\n\n${LIVE_END}\n\n## AUTHORS\n\nCustom authored text.\n`;

test('README honestly shows unconfigured state without inventing a build', () => temporary(root => {
  writeFileSync(join(root, 'README.md'), prose);
  updateReadme(root);
  const result = readFileSync(join(root, 'README.md'), 'utf8');
  assert.match(result, /Waiting for the first sync/);
  assert.doesNotMatch(result, /#000001/);
  assert.ok(result.startsWith('![AUTOCOMMIT](banner.png)'));
  assert.ok(result.endsWith('## AUTHORS\n\nCustom authored text.\n'));
  assert.equal(updateReadme(root), false);
}));

test('README renders verified live tape, authors, archive and finalizer from local mirror', () => temporary(root => {
  writeFileSync(join(root, 'README.md'), prose);
  const f = sealedFixture(); f.start(); f.write(15); f.edit('ROTATE', 0);
  publish(root, { contractAddress: ADDRESS, deployBlock: BLOCK }, f.machine, BLOCK, BLOCK_HASH, true);
  assert.equal(updateReadme(root), true);
  const result = readFileSync(join(root, 'README.md'), 'utf8');
  assert.match(result, /Build \| #000002/);
  assert.match(result, /1 \/ 256 instructions/);
  assert.match(result, /```asm\nMOVE\n```/);
  assert.match(result, /Authors in this build \| \[1\]/);
  assert.match(result, /Latest sealed build: \[#000001\]/);
  assert.match(result, /\*\*VERIFIED\*\*/);
  assert.match(result, /Finalizer:/);
  assert.ok(result.includes(f.machine.state.tapeHash));
  assert.ok(result.includes('Custom authored text.'));
  assert.equal(updateReadme(root), false);
}));

test('broken markers do not overwrite user prose', () => temporary(root => {
  const file = join(root, 'README.md');
  for (const text of ['User README', prose + LIVE_START, LIVE_END + prose]) {
    writeFileSync(file, text);
    assert.throws(() => updateReadme(root), /marker pair/);
    assert.equal(readFileSync(file, 'utf8'), text);
  }
}));
