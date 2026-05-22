import { inject } from 'vitest';

for (const [key, value] of Object.entries({
  LOCALNET_FULLNODE_URL: `http://127.0.0.1:${inject('localnetPort')}`,
  FAUCET_URL: `http://127.0.0.1:${inject('faucetPort')}`,
  NODE_ENV: 'test',
})) {
  process.env[key] = value;
}
