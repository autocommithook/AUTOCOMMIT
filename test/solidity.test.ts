import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { Address, Hex } from 'viem';
import { decode } from '../machine/decoder.ts';
import { Machine } from '../machine/state.ts';
const fixture = JSON.parse(readFileSync(new URL('./fixtures/solidity-events.json', import.meta.url), 'utf8')) as {
  address: Address; scenarios: { name: string; logs: { topics: Hex[]; data: Hex }[] }[];
};
for (const scenario of fixture.scenarios) {
  test(`actual Solidity events: ${scenario.name} hashes, edits and build transitions`, () => {
    const machine = new Machine(fixture.address);
    scenario.logs.forEach((log, index) => {
      const event = decode({ ...log, blockNumber: 1n, transactionHash: `0x${'00'.repeat(32)}`, transactionIndex: 0, logIndex: index });
      assert.ok(event);
      machine.apply(event);
    });
    if (scenario.name === 'seal') {
      assert.equal(machine.builds.length, 1);
      assert.equal(machine.builds[0].metadata.status, 'VERIFIED');
      assert.equal(machine.builds[0].tape.length, 15);
      assert.equal(machine.state.buildId, 2);
    } else assert.ok(machine.state.trace.some(event => event.type === 'EDIT'));
  });
}
