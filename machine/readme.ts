import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseAssembly } from './decoder.ts';
import { opcodeName, MAX_TAPE, MIN_SEAL_LENGTH } from './opcodes.ts';
import { buildDirectories, buildName } from './storage.ts';
import type { Checkpoint } from './storage.ts';
import type { Build } from './state.ts';
import { json } from './validator.ts';

export const LIVE_START = '<!-- AUTOCOMMIT:LIVE:START -->';
export const LIVE_END = '<!-- AUTOCOMMIT:LIVE:END -->';

export function liveReadme(root: string): string {
  const path = join(root, 'live/state.json');
  const state = existsSync(path) ? json<Checkpoint | { status: 'UNCONFIGURED' }>(path) : null;
  if (!state || state.status === 'UNCONFIGURED') {
    return '**Waiting for the first sync.**\n\nAdd `CONTRACT_ADDRESS` and `DEPLOY_BLOCK` under **Settings → Secrets and variables → Actions → Variables → Repository variables**, then run **Actions → Sync AUTOCOMMIT → Run workflow**. No on-chain state has been published yet.';
  }
  if (state.status !== 'BUILDING' || state.schemaVersion !== 1 || state.chainId !== 1) throw new Error('Cannot render unsupported live checkpoint');
  const instructions = parseAssembly(readFileSync(join(root, 'live/tape.asm'), 'utf8'));
  if (instructions.length !== state.tapeLength) throw new Error('README tape length differs from checkpoint');
  const authors = json<Record<string, string>>(join(root, 'live/authors.json'));
  const builds = buildDirectories(join(root, 'builds'));
  const latest = builds.at(-1);
  const lines = [
    '| Machine | Current state |',
    '| --- | --- |',
    `| Status | ${state.status} |`,
    `| Build | #${buildName(state.buildId)} |`,
    `| Tape | ${state.tapeLength} / ${MAX_TAPE} instructions |`,
    `| Tape hash | \`${state.tapeHash}\` |`,
    `| Authors in this build | [${Object.keys(authors).length}](live/authors.json) |`,
    `| Sealed builds | [${builds.length}](builds/) |`,
    `| Finalized through | [${state.lastProcessedBlock}](https://etherscan.io/block/${state.lastProcessedBlock}) |`,
    `| Contract | [${state.contractAddress}](https://etherscan.io/address/${state.contractAddress}) |`,
  ];
  if (state.lastTransaction) lines.push(`| Last machine transaction | [${state.lastTransaction.slice(0, 10)}…](https://etherscan.io/tx/${state.lastTransaction}) |`);
  lines.push('', '```asm', ...(instructions.length ? instructions.map(opcodeName) : ['; Empty tape — waiting for a write.']), '```', '',
    `[Tape](live/tape.asm) · [State](live/state.json) · [Trace](live/trace.json) · [Authors](live/authors.json)`, '',
    `A build seals when the final opcode is HALT and the tape has at least ${MIN_SEAL_LENGTH} instructions.`);
  if (latest) {
    const metadata = json<Build['metadata']>(join(root, 'builds', latest, 'metadata.json'));
    lines.push('', `Latest sealed build: [#${latest}](builds/${latest}/program.asm) — **${metadata.status}**.`, '',
      `Finalizer: [${metadata.finalizer}](https://etherscan.io/address/${metadata.finalizer}) · [Sealing transaction](https://etherscan.io/tx/${metadata.sealedTx}).`);
  }
  lines.push('', '*Snapshot of finalized Ethereum state. This section updates when the sync workflow runs.*');
  return lines.join('\n');
}

// Touch only the marked section. The surrounding README remains authored prose.
export function updateReadme(root: string): boolean {
  const path = join(root, 'README.md');
  if (!existsSync(path)) throw new Error('README.md is missing');
  const before = readFileSync(path, 'utf8');
  const start = before.indexOf(LIVE_START), end = before.indexOf(LIVE_END);
  if (start < 0 || end < start || before.indexOf(LIVE_START, start + 1) !== -1 || before.indexOf(LIVE_END, end + 1) !== -1) {
    throw new Error('README must contain one AUTOCOMMIT LIVE marker pair');
  }
  const after = before.slice(0, start + LIVE_START.length) + '\n\n' + liveReadme(root) + '\n\n' + before.slice(end);
  if (after === before) return false;
  writeFileSync(path, after);
  return true;
}
