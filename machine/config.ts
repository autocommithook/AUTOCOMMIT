import { fileURLToPath } from 'node:url';
import { getAddress, isAddress } from 'viem';
import type { Address } from 'viem';

export const ROOT = fileURLToPath(new URL('../', import.meta.url));
export const PUBLIC_RPC_URL = 'https://ethereum-rpc.publicnode.com';
export const CHAIN_ID = 1;
export interface Config { contractAddress: Address; deployBlock: number }
export function config(): Config {
  // GitHub Actions injects the two Repository variables into the sync process.
  const address = (process.env.CONTRACT_ADDRESS ?? '').trim();
  const block = (process.env.DEPLOY_BLOCK ?? '').trim();
  if (!isAddress(address, { strict: false }) || /^0x0+$/i.test(address)) throw new Error('Set the CONTRACT_ADDRESS Repository variable to the deployed AUTOCOMMIT address.');
  if (!/^[1-9]\d*$/.test(block) || !Number.isSafeInteger(Number(block))) throw new Error('The DEPLOY_BLOCK Repository variable must be a positive integer; scanning from block 0 is forbidden.');
  return { contractAddress: getAddress(address.toLowerCase()), deployBlock: Number(block) };
}
