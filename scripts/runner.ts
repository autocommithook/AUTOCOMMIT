import { closeSync, openSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { config, ROOT, CHAIN_ID } from '../machine/config.ts';
import { abi } from '../machine/abi.ts';
import { client, eventPages, retry } from '../machine/rpc.ts';
import { Machine, genesis, requireEqual, tape } from '../machine/state.ts';
import { loadCheckpoint, publish, recover } from '../machine/storage.ts';
import { updateReadme } from '../machine/readme.ts';
import { safeNumber } from '../machine/decoder.ts';

export async function run(reconstruct: boolean): Promise<void> {
  const cfg = config();
  const lock = join(ROOT, '.mirror.lock');
  let fd: number;
  try { fd = openSync(lock, 'wx'); }
  catch { throw new Error('Another mirror run holds .mirror.lock. If a process was killed, remove that file after confirming it has stopped.'); }
  try {
    recover(ROOT);
    requireEqual(await retry(() => client.getChainId()), CHAIN_ID, 'RPC is not Ethereum Mainnet');
    // Publish finalized state only. Never mix log reads and state reads at different block heights.
    const finalized = await retry(() => client.getBlock({ blockTag: 'finalized' }));
    const target = safeNumber(finalized.number);
    if (target < cfg.deployBlock) throw new Error('Deployment block is not finalized yet');
    const old = reconstruct ? null : loadCheckpoint(ROOT, cfg);
    let machine = old?.machine ?? new Machine(cfg.contractAddress);
    let from = old ? old.checkpoint.lastProcessedBlock + 1 : cfg.deployBlock;
    let rebuilding = reconstruct || !old;
    if (old) {
      const checkpointBlock = await retry(() => client.getBlock({ blockNumber: BigInt(old.checkpoint.lastProcessedBlock) }));
      if (checkpointBlock.hash !== old.checkpoint.lastProcessedBlockHash) {
        console.log('Checkpoint block changed; reconstructing from DEPLOY_BLOCK.');
        machine = new Machine(cfg.contractAddress); from = cfg.deployBlock; rebuilding = true;
      } else if (target < old.checkpoint.lastProcessedBlock) throw new Error('RPC finalized height is behind the checkpoint; retry later');
      else if (target === old.checkpoint.lastProcessedBlock) { updateReadme(ROOT); console.log('Already synchronized.'); return; }
    }
    console.log(`Reading Ethereum Mainnet blocks ${from}..${target}`);
    for await (const events of eventPages(cfg.contractAddress, BigInt(from), BigInt(target))) {
      for (const event of events) machine.apply(event);
    }
    const blockNumber = BigInt(target);
    const read = <T>(fn: () => Promise<T>): Promise<T> => retry(fn);
    requireEqual(await read(() => client.readContract({ address: cfg.contractAddress, abi, functionName: 'genesisTape', blockNumber })), genesis(cfg.contractAddress), 'Contract genesis mismatch');
    const onchain = await read(() => client.readContract({ address: cfg.contractAddress, abi, functionName: 'buildState', blockNumber }));
    const s = machine.state;
    requireEqual([safeNumber(onchain[0]), onchain[1], safeNumber(onchain[2]), safeNumber(onchain[3]), onchain[4]],
      [s.buildId, s.tapeHash, s.tapeLength, Object.keys(s.authors).length, false], 'Live state differs from contract; no changes published');
    requireEqual(await read(() => client.readContract({ address: cfg.contractAddress, abi, functionName: 'getTape', blockNumber })), tape(s), 'Live tape differs from contract');
    for (const build of machine.builds) {
      const record = await read(() => client.readContract({ address: cfg.contractAddress, abi, functionName: 'sealedBuild', args: [BigInt(build.metadata.buildId)], blockNumber }));
      const valid = record[0] === build.metadata.localHash && record[0] === build.metadata.programHash && record[1].toLowerCase() === build.metadata.finalizer && safeNumber(record[2]) === build.tape.length;
      build.metadata.status = valid ? 'VERIFIED' : 'INVALID';
    }
    // Detect inconsistent RPC views before committing the checkpoint.
    requireEqual((await retry(() => client.getBlock({ blockNumber }))).hash, finalized.hash, 'Target block changed while reading');
    publish(ROOT, cfg, machine, target, finalized.hash, rebuilding);
    if (machine.builds.some(build => build.metadata.status === 'INVALID')) throw new Error('INVALID sealed build saved for inspection; automatic GitHub commit is blocked');
    updateReadme(ROOT);
    console.log(`Synchronized: build #${s.buildId}, ${s.tapeLength} instructions, ${machine.builds.length} new sealed builds.`);
  } finally { closeSync(fd); rmSync(lock, { force: true }); }
}
export function fail(error: unknown): void { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; }
