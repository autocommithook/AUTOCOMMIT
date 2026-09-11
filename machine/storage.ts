import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync, rmSync, cpSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { Hex } from 'viem';
import type { Config } from './config.ts';
import { assembly } from './decoder.ts';
import type { TraceEvent } from './decoder.ts';
import { Machine, fresh, requireEqual, tape } from './state.ts';
import type { MachineState, Build } from './state.ts';
import { json, verifyBuild } from './validator.ts';

export interface Checkpoint {
  schemaVersion: 1; contractAddress: Config['contractAddress']; deployBlock: number; chainId: 1;
  buildId: number; tapeLength: number; tapeHash: Hex; lastProcessedBlock: number;
  lastProcessedBlockHash: Hex; lastTransaction: Hex | null; status: 'BUILDING';
  head: number; slots: number[]; initialSlots: number[];
}
export const buildName = (id: number): string => String(id).padStart(6, '0');
export function writeJson(path: string, value: unknown): void { writeFileSync(path, JSON.stringify(value, null, 2) + '\n'); }
export function writeBuild(root: string, build: Build): void {
  const directory = join(root, buildName(build.metadata.buildId));
  mkdirSync(directory, { recursive: true });
  writeFileSync(join(directory, 'program.asm'), assembly(build.tape, 'SEALED PROGRAM', build.metadata.buildId, build.metadata.programHash));
  writeJson(join(directory, 'trace.json'), build.trace);
  writeJson(join(directory, 'authors.json'), build.authors);
  writeJson(join(directory, 'metadata.json'), build.metadata);
}
export function buildDirectories(root: string): string[] {
  return existsSync(root) ? readdirSync(root).filter(name => /^\d{6,}$/.test(name)).sort((a, b) => Number(a) - Number(b)) : [];
}
export function loadCheckpoint(root: string, config: Config): { checkpoint: Checkpoint; machine: Machine } | null {
  const path = join(root, 'live/state.json');
  if (!existsSync(path)) return null;
  const raw = json<Checkpoint | { status: 'UNCONFIGURED' }>(path);
  if (raw.status === 'UNCONFIGURED') return null;
  const c = raw;
  requireEqual([c.schemaVersion, c.chainId, c.contractAddress, c.deployBlock], [1, 1, config.contractAddress, config.deployBlock], 'Configuration changed; run npm run reconstruct');
  if (!Number.isSafeInteger(c.lastProcessedBlock) || c.lastProcessedBlock < config.deployBlock) throw new Error('Invalid checkpoint block');
  // Check continuity of stale ring storage, not just the current assembly or last hash.
  let slots = Array<number>(256).fill(0);
  const directories = buildDirectories(join(root, 'builds'));
  requireEqual(directories.length, c.buildId - 1, 'Missing/extra sealed builds; reconstruct');
  for (let id = 1; id < c.buildId; id++) {
    const build = verifyBuild(join(root, 'builds', buildName(id)));
    requireEqual(build.metadata.initialSlots, slots, 'Archived ring continuity mismatch');
    const replay = new Machine(config.contractAddress, fresh(config.contractAddress, id, slots));
    for (const event of build.trace) replay.apply(event);
    slots = [...replay.state.slots];
  }
  requireEqual(c.initialSlots, slots, 'Live ring continuity mismatch');
  const machine = new Machine(config.contractAddress, fresh(config.contractAddress, c.buildId, slots));
  for (const event of json<TraceEvent[]>(join(root, 'live/trace.json'))) {
    if (event.block < config.deployBlock || event.block > c.lastProcessedBlock) throw new Error('Trace outside checkpoint range');
    machine.apply(event);
  }
  const s = machine.state;
  requireEqual([s.buildId, s.tapeLength, s.tapeHash, s.head, s.slots, s.status], [c.buildId, c.tapeLength, c.tapeHash, c.head, c.slots, c.status], 'Live checkpoint differs from replay');
  requireEqual(json(join(root, 'live/authors.json')), s.authors, 'Live authors differ from replay');
  requireEqual(readFileSync(join(root, 'live/tape.asm'), 'utf8'), assembly(tape(s), 'LIVE PROGRAM', s.buildId, s.tapeHash), 'Live assembly differs from replay');
  requireEqual(c.lastTransaction, s.trace.at(-1)?.tx ?? null, 'Checkpoint transaction differs from trace');
  machine.builds = [];
  return { checkpoint: c, machine };
}

// A small journal makes a killed process recoverable: roll back both directories before the next run.
export function recover(root: string): void {
  const stage = join(root, '.stage');
  if (!existsSync(stage)) return;
  if (existsSync(join(stage, 'journal.json'))) {
    const journal = json<Record<string, boolean>>(join(stage, 'journal.json'));
    for (const name of ['live', 'builds']) {
      const old = join(stage, `old-${name}`), target = join(root, name);
      if (existsSync(old)) { rmSync(target, { recursive: true, force: true }); renameSync(old, target); }
      else if (!journal[name]) rmSync(target, { recursive: true, force: true });
    }
  }
  rmSync(stage, { recursive: true, force: true });
}
export function publish(root: string, config: Config, machine: Machine, block: number, blockHash: Hex, reconstruct: boolean): void {
  const s = machine.state;
  requireEqual(s.status, 'BUILDING', 'Missing next BuildStarted');
  const stage = join(root, '.stage');
  mkdirSync(join(stage, 'live'), { recursive: true });
  mkdirSync(join(stage, 'builds'), { recursive: true });
  try {
    if (!reconstruct && existsSync(join(root, 'builds'))) cpSync(join(root, 'builds'), join(stage, 'builds'), { recursive: true });
    for (const build of machine.builds) writeBuild(join(stage, 'builds'), build);
    const checkpoint: Checkpoint = {
      schemaVersion: 1, ...config, chainId: 1, buildId: s.buildId, tapeLength: s.tapeLength, tapeHash: s.tapeHash,
      lastProcessedBlock: block, lastProcessedBlockHash: blockHash, lastTransaction: s.trace.at(-1)?.tx ?? null,
      status: 'BUILDING', head: s.head, slots: s.slots, initialSlots: s.initialSlots,
    };
    writeJson(join(stage, 'live/state.json'), checkpoint);
    writeJson(join(stage, 'live/trace.json'), s.trace);
    writeJson(join(stage, 'live/authors.json'), s.authors);
    writeFileSync(join(stage, 'live/tape.asm'), assembly(tape(s), 'LIVE PROGRAM', s.buildId, s.tapeHash));
    writeJson(join(stage, 'journal.json'), Object.fromEntries(['live', 'builds'].map(name => [name, existsSync(join(root, name))])));
    for (const name of ['live', 'builds']) {
      const target = join(root, name);
      if (existsSync(target)) renameSync(target, join(stage, `old-${name}`));
      renameSync(join(stage, name), target);
    }
    // Removing the journal is the commit point. Old snapshots are now disposable.
    rmSync(join(stage, 'journal.json'));
    rmSync(stage, { recursive: true });
  } catch (error) { recover(root); throw error; }
}
