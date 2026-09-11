import { join } from 'node:path';
import { ROOT, config } from '../machine/config.ts';
import { verifyBuild } from '../machine/validator.ts';
import { buildDirectories, buildName } from '../machine/storage.ts';
import { fresh, Machine, requireEqual } from '../machine/state.ts';
import { abi } from '../machine/abi.ts';
import { client, retry } from '../machine/rpc.ts';
import { fail } from './runner.ts';

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const all = args.includes('--all');
  const online = args.includes('--onchain');
  const ids = args.filter(arg => !arg.startsWith('--'));
  const id = ids[0];
  if (ids.length > 1 || args.some(arg => arg.startsWith('--') && arg !== '--all' && arg !== '--onchain') || (!all && (!id || !/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id)))) || (all && id)) throw new Error('Usage: npm run verify -- <buildId|--all> [--onchain]');
  const directories = buildDirectories(join(ROOT, 'builds'));
  const last = all ? Number(directories.at(-1) ?? 0) : Number(id);
  let slots = Array<number>(256).fill(0);
  let address: string | undefined;
  const cfg = online ? config() : null;
  const finalized = online ? await retry(() => client.getBlock({ blockTag: 'finalized' })) : null;
  for (let i = 1; i <= last; i++) {
    const build = verifyBuild(join(ROOT, 'builds', buildName(i)));
    requireEqual(build.metadata.buildId, i, 'Build folder ID mismatch');
    address ??= build.metadata.contractAddress;
    requireEqual(build.metadata.contractAddress, address, 'Mixed contract histories');
    requireEqual(build.metadata.initialSlots, slots, 'Ring continuity differs from preceding build');
    const replay = new Machine(build.metadata.contractAddress, fresh(build.metadata.contractAddress, i, slots));
    for (const event of build.trace) replay.apply(event);
    slots = [...replay.state.slots];
    if (cfg && finalized) {
      requireEqual(cfg.contractAddress, build.metadata.contractAddress, 'Configured contract differs from build');
      if (build.trace.some(event => event.block < cfg.deployBlock)) throw new Error('Trace precedes DEPLOY_BLOCK');
      const record = await retry(() => client.readContract({ address: cfg.contractAddress, abi, functionName: 'sealedBuild', args: [BigInt(i)], blockNumber: finalized.number }));
      requireEqual([record[0], record[1].toLowerCase(), Number(record[2])], [build.metadata.programHash, build.metadata.finalizer, build.metadata.tapeLength], 'On-chain sealed record differs');
    }
    if (all || i === last) console.log(`AUTOCOMMIT BUILD #${buildName(i)}\n\nLOCAL HASH\n${build.metadata.localHash}\n\n${online ? 'ONCHAIN HASH' : 'RECORDED ONCHAIN HASH (offline)'}\n${build.metadata.programHash}\n\nSTATUS\nVERIFIED\n`);
  }
  if (all && last === 0) console.log('No sealed builds yet.');
}
main().catch(error => { console.error('STATUS\nINVALID'); fail(error); });
