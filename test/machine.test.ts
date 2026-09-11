import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, writeFileSync, mkdirSync, renameSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Fixture, sealedFixture, ADDRESS, AUTHOR, BLOCK, BLOCK_HASH } from './fixture.ts';
import { Machine, fresh, tape, editHash, writeHash } from '../machine/state.ts';
import { OPCODES, EDITS, opcodeName } from '../machine/opcodes.ts';
import { assembly, parseAssembly } from '../machine/decoder.ts';
import { verifyBuild } from '../machine/validator.ts';
import { writeBuild, publish, loadCheckpoint, recover, writeJson } from '../machine/storage.ts';

const temporary = (fn: (root: string) => void): void => {
  const root = mkdtempSync(join(tmpdir(), 'autogithub-test-'));
  try { fn(root); } finally { rmSync(root, { recursive: true, force: true }); }
};

test('opcode mapping and assembly round trip; reject unknown instructions', () => {
  const ops = OPCODES.map((_, i) => i);
  assert.deepEqual(parseAssembly(assembly(ops, 'TEST', 1, BLOCK_HASH)), ops);
  assert.throws(() => parseAssembly('EXEC'));
  assert.throws(() => opcodeName(16));
});
test('DELETE uses tail replacement, MOVE wraps, REPLACE and FORK preserve exact order', () => {
  const f = new Fixture();
  [1, 2, 3, 4].forEach(op => f.write(op));
  f.edit('DELETE', 1); assert.deepEqual(tape(f.machine.state), [1, 4, 3]);
  f.edit('MOVE', 2); assert.deepEqual(tape(f.machine.state), [3, 4, 1]);
  f.edit('REPLACE', 1, 7); assert.deepEqual(tape(f.machine.state), [3, 7, 1]);
  f.edit('FORK', 0); assert.deepEqual(tape(f.machine.state), [3, 7, 1, 3]);
});
test('ROTATE exposes stale ring cells; it is not array rotation', () => {
  const f = new Fixture();
  [1, 2, 3].forEach(op => f.write(op));
  f.edit('ROTATE', 0);
  assert.deepEqual(tape(f.machine.state), [2, 3, 0]);
  f.edit('DELETE', 0);
  f.edit('ROTATE', 0);
  assert.deepEqual(tape(f.machine.state), [3, 0]);
});
test('ring storage survives seals and exposes old opcodes in the next build', () => {
  const f = sealedFixture(); const slots = [...f.machine.state.slots];
  f.start(); assert.deepEqual(f.machine.state.slots, slots);
  f.write(15); f.edit('ROTATE', 0);
  assert.deepEqual(tape(f.machine.state), [1]);
  assert.equal(f.machine.state.buildId, 2);
  assert.deepEqual(Object.values(f.machine.state.authors), [AUTHOR]);
});
test('full-capacity FORK changes history hash but cannot extend tape', () => {
  const f = new Fixture();
  for (let i = 0; i < 256; i++) f.write(1);
  const before = f.machine.state.tapeHash;
  f.edit('FORK', 1);
  assert.equal(f.machine.state.tapeLength, 256);
  assert.notEqual(f.machine.state.tapeHash, before);
  assert.throws(() => f.write(0), /Invalid append/);
});
test('empty edits and premature seals are rejected', () => {
  const f = new Fixture();
  assert.throws(() => f.event({ type: 'EDIT', trader: AUTHOR, edit: 'DELETE', index: 0, opcode: 'PUSH', tapeHash: BLOCK_HASH }));
  const g = new Fixture(); g.write(8);
  assert.throws(() => g.seal(), /Seal without/);
});
test('every edit is hash-checked and order is strict', () => {
  const f = new Fixture(); f.write(1);
  const m = new Machine(ADDRESS);
  for (const event of f.events) m.apply(event);
  assert.throws(() => m.apply(f.events.at(-1)!), /out-of-order/);
  const bad = structuredClone(f.events); bad.at(-1)!.tapeHash = BLOCK_HASH;
  const n = new Machine(ADDRESS);
  assert.throws(() => { for (const event of bad) n.apply(event); }, /hash mismatch/);
});
test('incremental replay equals full reconstruction across a seal', () => {
  const f = sealedFixture(); f.start(); f.write(9); f.edit('ROTATE', 0);
  for (let split = 1; split < f.events.length; split++) {
    const prefix = new Machine(ADDRESS);
    f.events.slice(0, split).forEach(e => prefix.apply(e));
    const resumed = new Machine(ADDRESS, JSON.parse(JSON.stringify(prefix.state)));
    f.events.slice(split).forEach(e => resumed.apply(e));
    assert.deepEqual(resumed.state, f.machine.state);
  }
});
test('sealed archive verifies trace and rejects tampered assembly, authors and metadata', () => temporary(root => {
  const build = sealedFixture().machine.builds[0];
  writeBuild(root, build); const directory = join(root, '000001');
  assert.equal(verifyBuild(directory).metadata.status, 'VERIFIED');
  for (const [name, value] of [['program.asm', 'PUSH\n'], ['authors.json', '{}'], ['metadata.json', JSON.stringify({ ...build.metadata, finalizer: ADDRESS })]]) {
    const path = join(directory, name), original = readFileSync(path, 'utf8');
    writeFileSync(path, value);
    assert.throws(() => verifyBuild(directory));
    writeFileSync(path, original);
  }
}));
test('program hash disagreement is explicitly INVALID', () => {
  const f = sealedFixture();
  const events = structuredClone(f.events); events.at(-1)!.programHash = BLOCK_HASH;
  const m = new Machine(ADDRESS); events.forEach(e => m.apply(e));
  assert.equal(m.builds[0].metadata.status, 'INVALID');
});
test('publication and checkpoint validation preserve all hidden ring state', () => temporary(root => {
  const f = sealedFixture(); f.start(); f.write(15); f.edit('ROTATE', 0);
  const config = { contractAddress: ADDRESS, deployBlock: BLOCK };
  publish(root, config, f.machine, BLOCK, BLOCK_HASH, true);
  const loaded = loadCheckpoint(root, config)!;
  assert.deepEqual(loaded.machine.state, f.machine.state);
  publish(root, config, loaded.machine, BLOCK, BLOCK_HASH, false);
  assert.deepEqual(loadCheckpoint(root, config)!.machine.state, f.machine.state);
  assert.throws(() => loadCheckpoint(root, { ...config, deployBlock: BLOCK + 1 }), /Configuration changed/);
  const statePath = join(root, 'live/state.json');
  const state = JSON.parse(readFileSync(statePath, 'utf8')); state.slots[42] = 15; writeJson(statePath, state);
  assert.throws(() => loadCheckpoint(root, config), /differs from replay/);
}));
test('hashes are history-dependent, even for the same final tape', () => {
  const a = new Fixture(); a.write(1);
  const b = new Fixture(); b.write(2); b.edit('REPLACE', 0, 1);
  assert.deepEqual(tape(a.machine.state), tape(b.machine.state));
  assert.notEqual(a.machine.state.tapeHash, b.machine.state.tapeHash);
});

test('ROTATE wraps the physical head at 256 without clearing stale storage', () => {
  const f = new Fixture(); [1, 2, 3].forEach(op => f.write(op));
  for (let i = 0; i < 256; i++) f.edit('ROTATE', 0);
  assert.equal(f.machine.state.head, 0);
  assert.deepEqual(tape(f.machine.state), [1, 2, 3]);
});
test('interrupted publication rolls back both directories before a retry', () => temporary(root => {
  const f = sealedFixture(); f.start();
  const config = { contractAddress: ADDRESS, deployBlock: BLOCK };
  publish(root, config, f.machine, BLOCK, BLOCK_HASH, true);
  mkdirSync(join(root, '.stage'));
  writeJson(join(root, '.stage/journal.json'), { live: true, builds: true });
  renameSync(join(root, 'live'), join(root, '.stage/old-live'));
  mkdirSync(join(root, 'live'));
  writeFileSync(join(root, 'live/state.json'), 'interrupted partial write');
  recover(root);
  assert.deepEqual(loadCheckpoint(root, config)!.machine.state, f.machine.state);
}));
