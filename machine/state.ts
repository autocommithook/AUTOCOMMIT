import { encodePacked, keccak256 } from 'viem';
import type { Address, Hex } from 'viem';
import { CHAIN_ID } from './config.ts';
import { EDITS, MAX_TAPE, MIN_SEAL_LENGTH, opcodeValue } from './opcodes.ts';
import { compareEvents } from './decoder.ts';
import type { TraceEvent } from './decoder.ts';

export function requireEqual(actual: unknown, expected: unknown, message: string): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(message);
}
export function genesis(address: Address): Hex {
  return keccak256(encodePacked(['string', 'uint256', 'address'], ['AUTOCOMMIT.genesis.v1', BigInt(CHAIN_ID), address]));
}
export function buildGenesis(address: Address, id: number): Hex {
  return keccak256(encodePacked(['bytes32', 'uint256'], [genesis(address), BigInt(id)]));
}
export function writeHash(previous: Hex, opcode: number, index: number): Hex {
  return keccak256(encodePacked(['bytes32', 'uint8', 'uint8', 'uint256'], [previous, 0, opcode, BigInt(index)]));
}
export function editHash(previous: Hex, action: number, opcode: number, index: number): Hex {
  return keccak256(encodePacked(['bytes32', 'uint8', 'uint8', 'uint8', 'uint256'], [previous, 1, action, opcode, BigInt(index)]));
}
export interface MachineState {
  buildId: number; tapeLength: number; tapeHash: Hex;
  head: number; slots: number[]; initialSlots: number[];
  status: 'AWAITING_START' | 'BUILDING' | 'SEALED';
  authors: Record<string, string>; trace: TraceEvent[];
}
export interface Build {
  tape: number[]; trace: TraceEvent[]; authors: Record<string, string>;
  metadata: {
    buildId: number; contractAddress: Address; chainId: 1; programHash: Hex;
    localHash: Hex; finalizer: string; sealedBlock: number; sealedTx: Hex;
    tapeLength: number; initialSlots: number[]; status: 'VERIFIED' | 'INVALID';
  };
}
export function fresh(address: Address, buildId = 1, slots = Array<number>(MAX_TAPE).fill(0)): MachineState {
  if (slots.length !== MAX_TAPE || slots.some(x => !Number.isInteger(x) || x < 0 || x > 15)) throw new Error('Invalid ring snapshot');
  return { buildId, tapeLength: 0, tapeHash: buildGenesis(address, buildId), head: 0, slots: [...slots], initialSlots: [...slots], status: 'AWAITING_START', authors: {}, trace: [] };
}
export function tape(state: MachineState): number[] {
  return Array.from({ length: state.tapeLength }, (_, i) => state.slots[(state.head + i) % MAX_TAPE]);
}
export function sealable(state: MachineState): boolean {
  return state.tapeLength >= MIN_SEAL_LENGTH && tape(state).at(-1) === opcodeValue('HALT');
}

// _slot is NEVER cleared by _trySeal. ROTATE changes only _head, without copying the old front.
// An ordinary array.rotate() or resetting storage between builds would silently reconstruct wrong code.
export class Machine {
  address: Address;
  state: MachineState;
  builds: Build[] = [];
  constructor(address: Address, state = fresh(address)) { this.address = address; this.state = structuredClone(state); }
  apply(event: TraceEvent): void {
    let s = this.state;
    const previous = s.trace.at(-1);
    if (previous && compareEvents(previous, event) >= 0) throw new Error('Duplicate or out-of-order event');
    if (event.type === 'START') {
      if (s.status === 'SEALED') {
        s = fresh(this.address, s.buildId + 1, s.slots);
        this.state = s;
      }
      requireEqual(s.status, 'AWAITING_START', 'Unexpected BuildStarted');
      requireEqual(event.buildId, s.buildId, 'Missing build history');
      requireEqual(event.tapeHash, s.tapeHash, 'Build genesis mismatch');
      s.status = 'BUILDING';
    } else {
      requireEqual(s.status, 'BUILDING', 'Missing BuildStarted (check DEPLOY_BLOCK)');
      if (sealable(s) && event.type !== 'SEAL') throw new Error('Missing ProgramSealed');
      if (event.type === 'AUTHOR') {
        requireEqual(event.buildId, s.buildId, 'Author belongs to another build');
        if (!event.author || Object.values(s.authors).includes(event.author)) throw new Error('Duplicate or missing author');
        requireEqual(event.authorCount, Object.keys(s.authors).length + 1, 'Author count mismatch');
        s.authors[String(Object.keys(s.authors).length)] = event.author;
      } else if (event.type === 'WRITE' || event.type === 'EDIT') {
        if (!event.trader || !Object.values(s.authors).includes(event.trader)) throw new Error('Missing AuthorAdded');
        const op = opcodeValue(event.opcode ?? '');
        const index = event.index;
        if (index === undefined || !Number.isInteger(index) || index < 0) throw new Error('Invalid tape index');
        const slot = (i: number): number => (s.head + i) % MAX_TAPE;
        let hash: Hex;
        if (event.type === 'WRITE') {
          if (s.tapeLength >= MAX_TAPE || index !== s.tapeLength) throw new Error('Invalid append');
          s.slots[slot(index)] = op;
          s.tapeLength++;
          hash = writeHash(s.tapeHash, op, index);
        } else {
          if (s.tapeLength === 0 || index >= s.tapeLength) throw new Error('Invalid edit index');
          const action = EDITS.indexOf(event.edit as typeof EDITS[number]);
          switch (event.edit) {
            case 'DELETE':
              requireEqual(op, s.slots[slot(index)], 'DELETE opcode mismatch');
              s.slots[slot(index)] = s.slots[slot(s.tapeLength - 1)];
              s.tapeLength--;
              break;
            case 'ROTATE':
              requireEqual(index, 0, 'ROTATE target must be zero');
              s.head = (s.head + 1) % MAX_TAPE;
              requireEqual(op, s.slots[s.head], 'ROTATE opcode mismatch');
              break;
            case 'MOVE': {
              const a = slot(index), b = slot((index + 1) % s.tapeLength);
              [s.slots[a], s.slots[b]] = [s.slots[b], s.slots[a]];
              requireEqual(op, s.slots[b], 'MOVE opcode mismatch');
              break;
            }
            case 'REPLACE': s.slots[slot(index)] = op; break;
            case 'FORK':
              requireEqual(op, s.slots[slot(index)], 'FORK opcode mismatch');
              if (s.tapeLength < MAX_TAPE) { s.slots[slot(s.tapeLength)] = op; s.tapeLength++; }
              break;
            default: throw new Error('Unknown edit operation');
          }
          hash = editHash(s.tapeHash, action, op, index);
        }
        requireEqual(event.tapeHash, hash, 'Mutation hash mismatch');
        s.tapeHash = hash;
      } else if (event.type === 'SEAL') {
        requireEqual(event.buildId, s.buildId, 'Seal build ID mismatch');
        if (!sealable(s)) throw new Error('Seal without length >= 8 and final HALT');
        requireEqual(event.finalizer, previous?.trader, 'Finalizer does not match sealing mutation');
        if (!event.programHash || !event.finalizer) throw new Error('Missing seal data');
        s.status = 'SEALED';
        this.builds.push({
          tape: tape(s), trace: [...s.trace, event], authors: { ...s.authors },
          metadata: { buildId: s.buildId, contractAddress: this.address, chainId: 1,
            programHash: event.programHash, localHash: s.tapeHash, finalizer: event.finalizer,
            sealedBlock: event.block, sealedTx: event.tx, tapeLength: s.tapeLength,
            initialSlots: [...s.initialSlots], status: event.programHash === s.tapeHash ? 'VERIFIED' : 'INVALID' },
        });
      }
    }
    s.trace.push(event);
  }
}
