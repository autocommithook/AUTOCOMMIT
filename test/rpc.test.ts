import test from 'node:test';
import assert from 'node:assert/strict';
import { encodeAbiParameters, encodeEventTopics } from 'viem';
import type { Hex } from 'viem';
import { abi } from '../machine/abi.ts';
import { eventPages, retry } from '../machine/rpc.ts';
import { decode } from '../machine/decoder.ts';
import type { RawLog } from '../machine/decoder.ts';
import { ADDRESS, BLOCK_HASH, BLOCK } from './fixture.ts';

const noWait = async (): Promise<void> => {};
const raw = (block = BigInt(BLOCK)): RawLog => ({
  blockNumber: block, transactionHash: BLOCK_HASH, transactionIndex: 0, logIndex: 0,
  topics: encodeEventTopics({ abi, eventName: 'BuildStarted', args: { buildId: 1n } }) as Hex[],
  data: encodeAbiParameters([{ type: 'bytes32' }], [BLOCK_HASH]),
});
test('ABI decodes real Solidity event encoding and ignores unrelated events', () => {
  assert.equal(decode(raw())?.type, 'START');
  assert.equal(decode(raw())?.buildId, 1);
  assert.equal(decode({ ...raw(), topics: [BLOCK_HASH] }), null);
  assert.throws(() => decode({ ...raw(), removed: true }));
  assert.throws(() => decode({ ...raw(), data: '0x' }));
});
test('bounded adaptive ranges retry without gaps or scanning before DEPLOY_BLOCK', async () => {
  const covered: bigint[] = []; const requested: [bigint, bigint][] = [];
  for await (const _page of eventPages(ADDRESS, 100n, 135n, async (a, b) => {
    requested.push([a, b]);
    if (b - a > 7n) throw new Error('range too large');
    for (let n = a; n <= b; n++) covered.push(n);
    return [];
  }, noWait)) { /* consume */ }
  assert.deepEqual(covered, Array.from({ length: 36 }, (_, i) => BigInt(100 + i)));
  assert.ok(requested.every(([a, b]) => a >= 100n && b <= 135n));
});
test('rate limit backoff is bounded and errors propagate on one-block failure', async () => {
  const waits: number[] = []; let calls = 0;
  assert.equal(await retry(async () => { if (calls++ < 3) throw new Error('429'); return 7; }, async n => { waits.push(n); }), 7);
  assert.deepEqual(waits, [500, 1000, 2000]);
  await assert.rejects(async () => {
    for await (const _ of eventPages(ADDRESS, 1n, 1n, async () => { throw new Error('offline'); }, noWait)) { /* consume */ }
  }, /Public RPC failed/);
});
test('never scan block zero; duplicate and out-of-range logs fail', async () => {
  for (const [from, reader] of [
    [0n, async () => []],
    [1n, async () => [raw(1n), raw(1n)]],
    [1n, async () => [raw(0n)]],
  ] as const) {
    await assert.rejects(async () => { for await (const _ of eventPages(ADDRESS, from, 1n, reader, noWait)) { /* consume */ } });
  }
});
