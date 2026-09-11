import { decodeEventLog, toEventSelector } from 'viem';
import type { Hex } from 'viem';
import { abi } from './abi.ts';
import { opcodeName, editName, opcodeValue } from './opcodes.ts';

export interface TraceEvent {
  block: number; tx: Hex; transactionIndex: number; logIndex: number;
  type: 'START' | 'AUTHOR' | 'WRITE' | 'EDIT' | 'SEAL';
  buildId?: number; trader?: string; author?: string; authorCount?: number;
  opcode?: string; edit?: string; index?: number; tapeHash?: Hex;
  programHash?: Hex; finalizer?: string;
}
export interface RawLog {
  blockNumber: bigint | null; transactionHash: Hex | null; transactionIndex: number | null;
  logIndex: number | null; data: Hex; topics: Hex[]; removed?: boolean;
}
const topics = new Set(abi.filter(item => item.type === 'event').map(item => toEventSelector(item)));
export function safeNumber(value: bigint): number {
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < 0) throw new Error(`Unsafe integer: ${value}`);
  return n;
}
export function decode(log: RawLog): TraceEvent | null {
  if (!topics.has(log.topics[0])) return null;
  if (log.removed || log.blockNumber === null || log.transactionHash === null || log.transactionIndex === null || log.logIndex === null) throw new Error('Unconfirmed or removed log');
  const base = { block: safeNumber(log.blockNumber), tx: log.transactionHash, transactionIndex: log.transactionIndex, logIndex: log.logIndex };
  const event = decodeEventLog({ abi, data: log.data, topics: log.topics as [Hex, ...Hex[]], strict: true });
  switch (event.eventName) {
    case 'BuildStarted': return { ...base, type: 'START', buildId: safeNumber(event.args.buildId), tapeHash: event.args.genesisTapeHash };
    case 'AuthorAdded': return { ...base, type: 'AUTHOR', buildId: safeNumber(event.args.buildId), author: event.args.author.toLowerCase(), authorCount: safeNumber(event.args.authorCount) };
    case 'InstructionWritten': return { ...base, type: 'WRITE', trader: event.args.trader.toLowerCase(), opcode: opcodeName(event.args.opcode), index: safeNumber(event.args.index), tapeHash: event.args.newTapeHash };
    case 'InstructionEdited': return { ...base, type: 'EDIT', trader: event.args.trader.toLowerCase(), edit: editName(event.args.editType), opcode: opcodeName(event.args.opcode), index: safeNumber(event.args.targetIndex), tapeHash: event.args.newTapeHash };
    case 'ProgramSealed': return { ...base, type: 'SEAL', buildId: safeNumber(event.args.buildId), programHash: event.args.programHash, finalizer: event.args.finalizer.toLowerCase() };
  }
}
export const compareEvents = (a: TraceEvent, b: TraceEvent): number => a.block - b.block || a.transactionIndex - b.transactionIndex || a.logIndex - b.logIndex;
export function assembly(tape: number[], title: string, buildId: number, hash: Hex): string {
  return `; AUTOCOMMIT ${title}\n; BUILD ${String(buildId).padStart(6, '0')}\n; TAPE HASH: ${hash}\n\n${tape.map(opcodeName).join('\n')}${tape.length ? '\n' : ''}`;
}
export function parseAssembly(text: string): number[] {
  return text.split(/\r?\n/).map(line => line.split(';')[0].trim()).filter(Boolean).map(opcodeValue);
}
