import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { encodeAbiParameters, encodeEventTopics, encodeFunctionData, encodeFunctionResult, toHex } from 'viem';
import type { Hex } from 'viem';
import { abi } from '../machine/abi.ts';
import { ROOT } from '../machine/config.ts';
import { genesis, tape } from '../machine/state.ts';
import { EDITS, opcodeValue } from '../machine/opcodes.ts';
import { ADDRESS, BLOCK, sealedFixture } from './fixture.ts';
import type { TraceEvent } from '../machine/decoder.ts';

function encodedEvent(event: TraceEvent): { topics: Hex[]; data: Hex } {
  switch (event.type) {
    case 'START': return { topics: encodeEventTopics({ abi, eventName: 'BuildStarted', args: { buildId: BigInt(event.buildId!) } }) as Hex[], data: encodeAbiParameters([{ type: 'bytes32' }], [event.tapeHash!]) };
    case 'AUTHOR': return { topics: encodeEventTopics({ abi, eventName: 'AuthorAdded', args: { buildId: BigInt(event.buildId!), author: event.author as Hex } }) as Hex[], data: encodeAbiParameters([{ type: 'uint256' }], [BigInt(event.authorCount!)]) };
    case 'WRITE': return { topics: encodeEventTopics({ abi, eventName: 'InstructionWritten', args: { trader: event.trader as Hex } }) as Hex[], data: encodeAbiParameters([{ type: 'uint8' }, { type: 'uint256' }, { type: 'bytes32' }], [opcodeValue(event.opcode!), BigInt(event.index!), event.tapeHash!]) };
    case 'EDIT': return { topics: encodeEventTopics({ abi, eventName: 'InstructionEdited', args: { trader: event.trader as Hex } }) as Hex[], data: encodeAbiParameters([{ type: 'uint8' }, { type: 'uint256' }, { type: 'uint8' }, { type: 'bytes32' }], [EDITS.indexOf(event.edit as typeof EDITS[number]), BigInt(event.index!), opcodeValue(event.opcode!), event.tapeHash!]) };
    case 'SEAL': return { topics: encodeEventTopics({ abi, eventName: 'ProgramSealed', args: { buildId: BigInt(event.buildId!) } }) as Hex[], data: encodeAbiParameters([{ type: 'bytes32' }, { type: 'address' }], [event.programHash!, event.finalizer as Hex]) };
  }
}

test('reconstruct/sync/verify CLIs work end to end with read-only JSON-RPC; idle sync is unchanged', () => {
  const root = mkdtempSync(join(tmpdir(), 'autogithub-cli-'));
  try {
    for (const name of ['machine', 'scripts']) cpSync(join(ROOT, name), join(root, name), { recursive: true });
    cpSync(join(ROOT, 'package.json'), join(root, 'package.json'));
    cpSync(join(ROOT, 'README.md'), join(root, 'README.md'));
    mkdirSync(join(root, 'node_modules'));
    // Resolve the already-installed dependency; the fixture has no network access.
    const viemDirectory = resolve(dirname(fileURLToPath(import.meta.resolve('viem'))), '..');
    symlinkSync(viemDirectory, join(root, 'node_modules/viem'));
    writeFileSync(join(root, 'mock.ts'), `
import {readFileSync,appendFileSync} from 'node:fs';
const snapshot=JSON.parse(readFileSync(new URL('./rpc.json',import.meta.url),'utf8'));
globalThis.fetch=async (_url,init)=>{
 const request=JSON.parse(String(init.body));
 const {method,params}=request;
 appendFileSync(new URL('./requests.jsonl',import.meta.url),JSON.stringify({method,params})+'\\n');
 let result;
 if(method==='eth_chainId') result='0x1';
 else if(method==='eth_getBlockByNumber') {
   const n=params[0]==='finalized'?snapshot.target:Number(BigInt(params[0]));
   result={number:'0x'+n.toString(16),hash:'0x'+n.toString(16).padStart(64,'0'),parentHash:'0x'+(n-1).toString(16).padStart(64,'0'),transactions:[],timestamp:'0x1',gasLimit:'0x1000000',gasUsed:'0x0',size:'0x1',difficulty:'0x0',totalDifficulty:'0x0',baseFeePerGas:'0x1',extraData:'0x',nonce:'0x0000000000000000'};
 } else if(method==='eth_getLogs') {
   result=snapshot.logs.filter(log=>BigInt(log.blockNumber)>=BigInt(params[0].fromBlock)&&BigInt(log.blockNumber)<=BigInt(params[0].toBlock));
 } else if(method==='eth_call') {
   result=snapshot.calls[params[0].data];
   if(!result) throw Error('Unexpected contract read: '+params[0].data);
 } else throw Error('Forbidden RPC method: '+method);
 return new Response(JSON.stringify({jsonrpc:'2.0',id:request.id,result}),{headers:{'content-type':'application/json'}});
};
`);
    const fixture = sealedFixture(); fixture.start();
    function snapshot(target: number): void {
      const s = fixture.machine.state;
      const calls: Record<string, Hex> = {};
      calls[encodeFunctionData({ abi, functionName: 'genesisTape' })] = encodeFunctionResult({ abi, functionName: 'genesisTape', result: genesis(ADDRESS) });
      calls[encodeFunctionData({ abi, functionName: 'getTape' })] = encodeFunctionResult({ abi, functionName: 'getTape', result: tape(s) });
      calls[encodeFunctionData({ abi, functionName: 'buildState' })] = encodeFunctionResult({ abi, functionName: 'buildState', result: [BigInt(s.buildId), s.tapeHash, BigInt(s.tapeLength), BigInt(Object.keys(s.authors).length), false] });
      for (const b of fixture.machine.builds) calls[encodeFunctionData({ abi, functionName: 'sealedBuild', args: [BigInt(b.metadata.buildId)] })] = encodeFunctionResult({ abi, functionName: 'sealedBuild', result: [b.metadata.programHash, b.metadata.finalizer as Hex, BigInt(b.metadata.tapeLength)] });
      const logs = fixture.events.map(e => ({ ...encodedEvent(e), address: ADDRESS, blockNumber: toHex(e.block), blockHash: toHex(e.block, { size: 32 }), transactionHash: e.tx, transactionIndex: toHex(e.transactionIndex), logIndex: toHex(e.logIndex), removed: false }));
      writeFileSync(join(root, 'rpc.json'), JSON.stringify({ target, calls, logs }));
    }
    function cli(script: string, ...args: string[]): void {
      const result = spawnSync(process.execPath, ['--import', './mock.ts', `scripts/${script}.ts`, ...args], { cwd: root, env: { ...process.env, CONTRACT_ADDRESS: ADDRESS, DEPLOY_BLOCK: String(BLOCK) }, encoding: 'utf8', timeout: 10_000 });
      assert.equal(result.status, 0, result.stderr + result.stdout);
    }
    snapshot(BLOCK); cli('reconstruct');
    assert.equal(JSON.parse(readFileSync(join(root, 'live/state.json'), 'utf8')).buildId, 2);
    const archiveBefore = readFileSync(join(root, 'builds/000001/metadata.json'), 'utf8');
    const oldCount = fixture.events.length;
    fixture.write(15); fixture.edit('ROTATE', 0);
    for (const event of fixture.events.slice(oldCount)) event.block = BLOCK + 1;
    snapshot(BLOCK + 1);
    writeFileSync(join(root, 'requests.jsonl'), '');
    cli('sync');
    const requests = readFileSync(join(root, 'requests.jsonl'), 'utf8').trim().split('\n').map(line => JSON.parse(line));
    assert.ok(requests.filter(r => r.method === 'eth_getLogs').every(r => BigInt(r.params[0].fromBlock) === BigInt(BLOCK + 1)));
    assert.equal(readFileSync(join(root, 'builds/000001/metadata.json'), 'utf8'), archiveBefore);
    assert.match(readFileSync(join(root, 'README.md'), 'utf8'), /#000002/);
    assert.match(readFileSync(join(root, 'README.md'), 'utf8'), /\nMOVE\n/);
    const readmeBefore = readFileSync(join(root, 'README.md'), 'utf8');
    const stateBefore = readFileSync(join(root, 'live/state.json'), 'utf8');
    assert.equal(JSON.parse(stateBefore).tapeLength, 1);
    assert.match(readFileSync(join(root, 'live/tape.asm'), 'utf8'), /\nMOVE\n$/);
    cli('sync');
    assert.equal(readFileSync(join(root, 'live/state.json'), 'utf8'), stateBefore);
    assert.equal(readFileSync(join(root, 'README.md'), 'utf8'), readmeBefore);
    cli('verify-build', '1', '--onchain');
  } finally { rmSync(root, { recursive: true, force: true }); }
});
