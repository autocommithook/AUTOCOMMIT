import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Machine, fresh, requireEqual, tape } from './state.ts';
import type { Build } from './state.ts';
import { parseAssembly } from './decoder.ts';
import type { TraceEvent } from './decoder.ts';

export const json = <T>(path: string): T => JSON.parse(readFileSync(path, 'utf8')) as T;
export function verifyBuild(directory: string): Build {
  const metadata = json<Build['metadata']>(join(directory, 'metadata.json'));
  if (!Number.isSafeInteger(metadata.buildId) || metadata.buildId < 1 || metadata.chainId !== 1) throw new Error('Invalid build identity');
  const trace = json<TraceEvent[]>(join(directory, 'trace.json'));
  const machine = new Machine(metadata.contractAddress, fresh(metadata.contractAddress, metadata.buildId, metadata.initialSlots));
  for (const event of trace) machine.apply(event);
  requireEqual(machine.builds.length, 1, 'Expected exactly one sealed build');
  const build = machine.builds[0];
  requireEqual(build.metadata.status, 'VERIFIED', 'Program hash mismatch: INVALID');
  requireEqual(machine.state.status, 'SEALED', 'Trace must end at seal');
  requireEqual(metadata, build.metadata, 'Metadata differs from reconstructed history');
  requireEqual(parseAssembly(readFileSync(join(directory, 'program.asm'), 'utf8')), tape(machine.state), 'Assembly differs from replayed ring buffer');
  requireEqual(json(join(directory, 'authors.json')), build.authors, 'Authors differ from AuthorAdded events');
  return build;
}
