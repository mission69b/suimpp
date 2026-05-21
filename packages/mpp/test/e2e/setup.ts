import {
  FaucetRateLimitError,
  requestSuiFromFaucetV2,
} from '@mysten/sui/faucet';
import { SuiGrpcClient } from '@mysten/sui/grpc';

const DEFAULT_FAUCET_URL = process.env.FAUCET_URL ?? 'http://127.0.0.1:9123';
const DEFAULT_FULLNODE_URL =
  process.env.LOCALNET_FULLNODE_URL ?? 'http://127.0.0.1:9000';

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getFullnodeUrl() {
  return DEFAULT_FULLNODE_URL;
}

export function getClient(): SuiGrpcClient {
  return new SuiGrpcClient({
    network: 'localnet',
    baseUrl: DEFAULT_FULLNODE_URL,
  });
}

export async function fundAddress(address: string) {
  let lastError: unknown;

  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      await requestSuiFromFaucetV2({
        host: DEFAULT_FAUCET_URL,
        recipient: address,
      });
      return;
    } catch (error) {
      if (error instanceof FaucetRateLimitError) throw error;
      lastError = error;
      await delay(1000 * (attempt + 1));
    }
  }

  throw lastError;
}
