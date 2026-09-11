import test from 'node:test';
import assert from 'node:assert/strict';
import { config, PUBLIC_RPC_URL, CHAIN_ID } from '../machine/config.ts';
import { ADDRESS } from './fixture.ts';

test('only address and positive deployment block configure the read-only mainnet mirror', () => {
  const originalAddress = process.env.CONTRACT_ADDRESS;
  const originalBlock = process.env.DEPLOY_BLOCK;
  try {
    delete process.env.CONTRACT_ADDRESS;
    delete process.env.DEPLOY_BLOCK;
    assert.throws(() => config(), /CONTRACT_ADDRESS Repository variable/);
    process.env.CONTRACT_ADDRESS = ADDRESS;
    process.env.DEPLOY_BLOCK = '20000000';
    assert.deepEqual(config(), { contractAddress: ADDRESS, deployBlock: 20_000_000 });
    assert.equal(CHAIN_ID, 1);
    assert.equal(PUBLIC_RPC_URL, 'https://ethereum-rpc.publicnode.com');
    for (const block of ['', '0', '-1', '1.5', '0x100', '9007199254740992']) {
      process.env.DEPLOY_BLOCK = block;
      assert.throws(() => config(), /DEPLOY_BLOCK/);
    }
    process.env.DEPLOY_BLOCK = '1'; process.env.CONTRACT_ADDRESS = '0x' + '00'.repeat(20);
    assert.throws(() => config(), /CONTRACT_ADDRESS/);
  } finally {
    if (originalAddress === undefined) delete process.env.CONTRACT_ADDRESS; else process.env.CONTRACT_ADDRESS = originalAddress;
    if (originalBlock === undefined) delete process.env.DEPLOY_BLOCK; else process.env.DEPLOY_BLOCK = originalBlock;
  }
});
