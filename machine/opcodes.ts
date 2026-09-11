// Canonical enum order from src/AUTOCOMMIT.sol. Never substitute an assembly VM's opcode set.
export const OPCODES = ['PUSH', 'MOVE', 'XOR', 'COPY', 'LINK', 'CHECK', 'SHIFT', 'RETURN', 'HALT', 'OPEN', 'LOCK', 'ADD', 'DROP', 'SWAP', 'JUMP', 'BREAK'] as const;
export const EDITS = ['DELETE', 'ROTATE', 'MOVE', 'REPLACE', 'FORK'] as const;
export const MAX_TAPE = 256;
export const MIN_SEAL_LENGTH = 8;
export function opcodeName(value: number): string {
  if (!Number.isInteger(value) || value < 0 || value >= OPCODES.length) throw new Error(`Invalid opcode: ${value}`);
  return OPCODES[value];
}
export function opcodeValue(name: string): number {
  const value = OPCODES.indexOf(name as typeof OPCODES[number]);
  if (value < 0) throw new Error(`Unknown opcode: ${name}`);
  return value;
}
export function editName(value: number): string {
  if (!Number.isInteger(value) || value < 0 || value >= EDITS.length) throw new Error(`Invalid edit: ${value}`);
  return EDITS[value];
}
