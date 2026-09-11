import { join } from 'node:path';
import { readFileSync, writeFileSync } from 'node:fs';
import { ROOT } from '../machine/config.ts';
import { publish } from '../machine/storage.ts';
import { sealedFixture, ADDRESS, BLOCK, BLOCK_HASH } from '../test/fixture.ts';

// Deterministic, synthetic fixture only. Never write sample data into the actual mirror.
const fixture = sealedFixture();
fixture.start(); fixture.write(15); fixture.edit('ROTATE', 0);
const root = join(ROOT, 'examples');
publish(root, { contractAddress: ADDRESS, deployBlock: BLOCK }, fixture.machine, BLOCK, BLOCK_HASH, true);
for (const path of ['live/tape.asm', 'builds/000001/program.asm']) {
  const file = join(root, path);
  writeFileSync(file, '; SYNTHETIC EXAMPLE — NOT ETHEREUM DATA\n' + readFileSync(file, 'utf8'));
}
console.log('Generated synthetic examples/live and examples/builds/000001.');
