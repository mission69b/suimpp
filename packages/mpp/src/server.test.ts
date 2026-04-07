import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { InMemoryDigestStore } from './in-memory-digest-store.js';

const USDC_TYPE = '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC';
const RECIPIENT = '0xrecipient_address';
const SENDER = '0xsender_address';

function buildMockTx({
  success = true,
  coinType = USDC_TYPE,
  recipientAddr = RECIPIENT,
  amount = '10000',
  senderAddr = SENDER,
}: {
  success?: boolean;
  coinType?: string;
  recipientAddr?: string;
  amount?: string;
  senderAddr?: string;
} = {}) {
  const txData = {
    digest: '0xdigest123',
    status: { success },
    balanceChanges: [
      { coinType, address: recipientAddr, amount },
      { coinType, address: senderAddr, amount: `-${amount}` },
    ],
  };

  return success
    ? { Transaction: txData, FailedTransaction: undefined }
    : { Transaction: undefined, FailedTransaction: txData };
}

function buildCredential(digest = '0xdigest123', amount = '0.01') {
  return {
    payload: { digest },
    challenge: {
      request: {
        amount,
        currency: USDC_TYPE,
        recipient: RECIPIENT,
      },
    },
  };
}

const mockGetTransaction = vi.fn();

vi.mock('@mysten/sui/grpc', () => ({
  SuiGrpcClient: vi.fn().mockImplementation(() => ({
    core: {
      getTransaction: mockGetTransaction,
    },
  })),
}));

vi.mock('@mysten/sui/utils', () => ({
  normalizeSuiAddress: vi.fn((addr: string) => addr.toLowerCase()),
}));

describe('server verify', () => {
  let suiFn: typeof import('./server.js').sui;
  const originalEnv = process.env.NODE_ENV;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import('./server.js');
    suiFn = mod.sui;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('accepts valid payment with correct amount', async () => {
    mockGetTransaction.mockResolvedValue(buildMockTx());

    const serverMethod = suiFn({
      currency: USDC_TYPE,
      recipient: RECIPIENT,
      store: new InMemoryDigestStore(),
    });

    const result = await (serverMethod as any).verify({
      credential: buildCredential(),
    });

    expect(result.reference).toBe('0xdigest123');
    expect(result.status).toBe('success');
  });

  it('rejects failed transaction', async () => {
    mockGetTransaction.mockResolvedValue(buildMockTx({ success: false }));

    const serverMethod = suiFn({
      currency: USDC_TYPE,
      recipient: RECIPIENT,
      store: new InMemoryDigestStore(),
    });

    await expect(
      (serverMethod as any).verify({ credential: buildCredential() }),
    ).rejects.toThrow('Transaction failed on-chain');
  });

  it('rejects when payment not sent to recipient', async () => {
    mockGetTransaction.mockResolvedValue(
      buildMockTx({ recipientAddr: '0xwrong_address' }),
    );

    const serverMethod = suiFn({
      currency: USDC_TYPE,
      recipient: RECIPIENT,
      store: new InMemoryDigestStore(),
    });

    await expect(
      (serverMethod as any).verify({ credential: buildCredential() }),
    ).rejects.toThrow('Payment not found');
  });

  it('rejects when amount is less than requested', async () => {
    mockGetTransaction.mockResolvedValue(buildMockTx({ amount: '5000' }));

    const serverMethod = suiFn({
      currency: USDC_TYPE,
      recipient: RECIPIENT,
      store: new InMemoryDigestStore(),
    });

    await expect(
      (serverMethod as any).verify({ credential: buildCredential() }),
    ).rejects.toThrow('Transferred');
  });

  it('rejects when no balance changes', async () => {
    mockGetTransaction.mockResolvedValue({
      Transaction: {
        digest: '0xdigest123',
        status: { success: true },
        balanceChanges: [],
      },
    });

    const serverMethod = suiFn({
      currency: USDC_TYPE,
      recipient: RECIPIENT,
      store: new InMemoryDigestStore(),
    });

    await expect(
      (serverMethod as any).verify({ credential: buildCredential() }),
    ).rejects.toThrow('Payment not found');
  });
});

describe('digest replay protection', () => {
  let suiFn: typeof import('./server.js').sui;
  const originalEnv = process.env.NODE_ENV;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import('./server.js');
    suiFn = mod.sui;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('accepts a valid digest on first use', async () => {
    const store = new InMemoryDigestStore();
    mockGetTransaction.mockResolvedValue(buildMockTx());

    const serverMethod = suiFn({
      currency: USDC_TYPE,
      recipient: RECIPIENT,
      store,
    });

    const result = await (serverMethod as any).verify({
      credential: buildCredential(),
    });

    expect(result.reference).toBe('0xdigest123');
    expect(result.status).toBe('success');
  });

  it('rejects the same digest on second use', async () => {
    const store = new InMemoryDigestStore();
    mockGetTransaction.mockResolvedValue(buildMockTx());

    const serverMethod = suiFn({
      currency: USDC_TYPE,
      recipient: RECIPIENT,
      store,
    });

    await (serverMethod as any).verify({
      credential: buildCredential(),
    });

    await expect(
      (serverMethod as any).verify({
        credential: buildCredential('0xdigest123', '0.02'),
      }),
    ).rejects.toThrow('Digest already used');
  });

  it('accepts a different digest after first is consumed', async () => {
    const store = new InMemoryDigestStore();

    const serverMethod = suiFn({
      currency: USDC_TYPE,
      recipient: RECIPIENT,
      store,
    });

    mockGetTransaction.mockResolvedValue(buildMockTx());
    await (serverMethod as any).verify({
      credential: buildCredential('0xdigest123'),
    });

    mockGetTransaction.mockResolvedValue({
      Transaction: {
        digest: '0xdigest456',
        status: { success: true },
        balanceChanges: [
          { coinType: USDC_TYPE, address: RECIPIENT, amount: '10000' },
          { coinType: USDC_TYPE, address: SENDER, amount: '-10000' },
        ],
      },
    });

    const result = await (serverMethod as any).verify({
      credential: buildCredential('0xdigest456'),
    });

    expect(result.reference).toBe('0xdigest456');
  });

  it('accepts the same digest after TTL expiry', async () => {
    const store = new InMemoryDigestStore(50);
    mockGetTransaction.mockResolvedValue(buildMockTx());

    const serverMethod = suiFn({
      currency: USDC_TYPE,
      recipient: RECIPIENT,
      store,
    });

    await (serverMethod as any).verify({
      credential: buildCredential(),
    });

    await new Promise((r) => setTimeout(r, 100));

    const result = await (serverMethod as any).verify({
      credential: buildCredential(),
    });
    expect(result.status).toBe('success');
  });

  it('throws on missing store in production', () => {
    process.env.NODE_ENV = 'production';
    expect(() =>
      suiFn({ currency: USDC_TYPE, recipient: RECIPIENT }),
    ).toThrow('DigestStore is required in production');
  });

  it('marks digest before returning receipt (store.set failure = no free call)', async () => {
    const store: import('./server.js').DigestStore = {
      has: vi.fn().mockResolvedValue(false),
      set: vi.fn().mockRejectedValue(new Error('Redis down')),
    };
    mockGetTransaction.mockResolvedValue(buildMockTx());

    const serverMethod = suiFn({
      currency: USDC_TYPE,
      recipient: RECIPIENT,
      store,
    });

    await expect(
      (serverMethod as any).verify({ credential: buildCredential() }),
    ).rejects.toThrow('Redis down');

    expect(store.set).toHaveBeenCalledWith('0xdigest123');
  });
});
