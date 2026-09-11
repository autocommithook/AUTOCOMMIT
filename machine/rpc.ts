import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import { PUBLIC_RPC_URL } from './config.ts';
import { decode, compareEvents } from './decoder.ts';
import type { TraceEvent, RawLog } from './decoder.ts';
import type { Address } from 'viem';

export const client = createPublicClient({ chain: mainnet, transport: http(PUBLIC_RPC_URL, { timeout: 30_000, retryCount: 0 }) });
export const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));
export async function retry<T>(read: () => Promise<T>, sleep = delay): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try { return await read(); }
    catch (error) {
      if (attempt === 4) throw error;
      await sleep(500 * 2 ** attempt);
    }
  }
}
export type LogReader = (from: bigint, to: bigint) => Promise<RawLog[]>;
// Sequential requests, bounded pages and exponential backoff avoid flooding a shared RPC.
// All logs for the address are fetched so a malformed relevant event is never silently discarded.
export async function* eventPages(address: Address, from: bigint, to: bigint, reader: LogReader =
  (a, b) => client.getLogs({ address, fromBlock: a, toBlock: b }), sleep = delay): AsyncGenerator<TraceEvent[]> {
  if (from <= 0n) throw new Error('Refusing to scan from block 0');
  let width = 1_000n;
  while (from <= to) {
    const end = from + width - 1n < to ? from + width - 1n : to;
    let logs: RawLog[];
    try { logs = await retry(() => reader(from, end), sleep); }
    catch (error) {
      if (end === from) throw new Error(`Public RPC failed at block ${from}; no progress published`, { cause: error });
      width = width / 2n || 1n;
      continue;
    }
    const events: TraceEvent[] = [];
    for (const log of logs) {
      if (log.blockNumber === null || log.blockNumber < from || log.blockNumber > end) throw new Error('RPC returned a log outside the requested range');
      const event = decode(log);
      if (event) events.push(event);
    }
    events.sort(compareEvents);
    for (let i = 1; i < events.length; i++) {
      if (compareEvents(events[i - 1], events[i]) === 0) throw new Error('RPC returned duplicate logs');
    }
    yield events;
    from = end + 1n;
    width = width < 1_000n ? (width * 2n > 1_000n ? 1_000n : width * 2n) : width;
    await sleep(150);
  }
}
