import type { Address, Hex } from 'viem';
import { Machine, buildGenesis, editHash, writeHash, tape } from '../machine/state.ts';
import { EDITS, opcodeName } from '../machine/opcodes.ts';
import type { TraceEvent } from '../machine/decoder.ts';

export const ADDRESS = '0x1111111111111111111111111111111111111111' as Address;
export const AUTHOR = '0x2222222222222222222222222222222222222222';
export const BLOCK = 20_000_000;
export const BLOCK_HASH = `0x${'ab'.repeat(32)}` as Hex;
export class Fixture {
  machine = new Machine(ADDRESS);
  events: TraceEvent[] = [];
  step = 0;
  constructor() { this.start(); }
  event(fields: Omit<TraceEvent, 'block' | 'tx' | 'transactionIndex' | 'logIndex'>): TraceEvent {
    const event: TraceEvent = { block: BLOCK, tx: `0x${'cd'.repeat(32)}`, transactionIndex: 0, logIndex: this.step++, ...fields };
    this.events.push(event);
    this.machine.apply(event);
    return event;
  }
  start(): void {
    const s = this.machine.state;
    const id = s.status === 'SEALED' ? s.buildId + 1 : s.buildId;
    this.event({ type: 'START', buildId: id, tapeHash: buildGenesis(ADDRESS, id) });
  }
  author(trader = AUTHOR): void {
    const s = this.machine.state;
    if (!Object.values(s.authors).includes(trader)) this.event({ type: 'AUTHOR', buildId: s.buildId, author: trader, authorCount: Object.keys(s.authors).length + 1 });
  }
  write(op: number, trader = AUTHOR): void {
    this.author(trader);
    const s = this.machine.state;
    this.event({ type: 'WRITE', trader, opcode: opcodeName(op), index: s.tapeLength, tapeHash: writeHash(s.tapeHash, op, s.tapeLength) });
  }
  edit(edit: typeof EDITS[number], index: number, replacement = 0): void {
    this.author();
    const s = this.machine.state;
    const op = edit === 'REPLACE' ? replacement : edit === 'ROTATE' ? s.slots[(s.head + 1) % 256] : tape(s)[index];
    if (edit === 'ROTATE') index = 0;
    this.event({ type: 'EDIT', trader: AUTHOR, edit, opcode: opcodeName(op), index, tapeHash: editHash(s.tapeHash, EDITS.indexOf(edit), op, index) });
  }
  seal(): void {
    const s = this.machine.state;
    this.event({ type: 'SEAL', buildId: s.buildId, programHash: s.tapeHash, finalizer: AUTHOR });
  }
}
export function sealedFixture(): Fixture {
  const fixture = new Fixture();
  for (const op of [0, 1, 2, 3, 4, 5, 6, 8]) fixture.write(op);
  fixture.seal();
  return fixture;
}
