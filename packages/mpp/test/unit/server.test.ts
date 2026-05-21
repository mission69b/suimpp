import type { Challenge, Credential, Method } from 'mppx';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InMemoryDigestStore } from '../../src/in-memory-digest-store.js';
import type { suiCharge } from '../../src/method.js';
import {
  type DigestStore,
  SUI_USDC_TYPE,
  USDC,
  type sui as createSuiServer,
} from '../../src/server.js';

const RECIPIENT = '0xrecipient_address';
const SENDER = '0xsender_address';
const ALT_CURRENCY = '0x::eurc::EURC';

type SuiServerMethod = Method.Server<typeof suiCharge>;
type SuiChargeRequest = {
  amount: string;
  currency: string;
  recipient: string;
};
type SuiChargeChallenge = Challenge.Challenge<
  SuiChargeRequest,
  'charge',
  'sui'
>;
type SuiCredential = Credential.Credential<
  { digest: string; signature: string },
  SuiChargeChallenge
>;

function buildMockTx({
  success = true,
  coinType = SUI_USDC_TYPE,
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
    transaction: {
      sender: senderAddr,
    },
    balanceChanges: [
      { coinType, address: recipientAddr, amount },
      { coinType, address: senderAddr, amount: `-${amount}` },
    ],
  };

  return success
    ? { Transaction: txData, FailedTransaction: undefined }
    : { Transaction: undefined, FailedTransaction: txData };
}

function buildCredential(
  digest = '0xdigest123',
  amount = '0.01',
  signature = 'proof_sig',
  currency = SUI_USDC_TYPE,
): SuiCredential {
  return {
    payload: { digest, signature },
    challenge: {
      id: 'test-challenge',
      intent: 'charge',
      method: 'sui',
      realm: 'test',
      request: {
        amount,
        currency,
        recipient: RECIPIENT,
      },
    },
  };
}

function verifyPayment(
  serverMethod: SuiServerMethod,
  credential = buildCredential(),
) {
  return serverMethod.verify({
    credential,
    request: credential.challenge.request,
  });
}

const { mockGetTransaction, mockVerifyPersonalMessageSignature } = vi.hoisted(
  () => ({
    mockGetTransaction: vi.fn(),
    mockVerifyPersonalMessageSignature: vi.fn(),
  }),
);

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

vi.mock('@mysten/sui/verify', () => ({
  verifyPersonalMessageSignature: mockVerifyPersonalMessageSignature,
}));

describe('server verify', () => {
  let suiFn: typeof createSuiServer;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockVerifyPersonalMessageSignature.mockResolvedValue({
      toSuiAddress: () => SENDER,
    });
    const mod = await import('../../src/server.js');
    suiFn = mod.sui;
  });

  it('accepts valid payment with correct amount', async () => {
    mockGetTransaction.mockResolvedValue(buildMockTx());

    const serverMethod = suiFn({
      currency: USDC,
      recipient: RECIPIENT,
      store: new InMemoryDigestStore(),
    });

    const result = await verifyPayment(serverMethod);

    expect(result.reference).toBe('0xdigest123');
    expect(result.status).toBe('success');
  });

  it('rejects failed transaction', async () => {
    mockGetTransaction.mockResolvedValue(buildMockTx({ success: false }));

    const serverMethod = suiFn({
      currency: USDC,
      recipient: RECIPIENT,
      store: new InMemoryDigestStore(),
    });

    await expect(verifyPayment(serverMethod)).rejects.toThrow(
      'Transaction failed on-chain',
    );
  });

  it('rejects when payment not sent to recipient', async () => {
    mockGetTransaction.mockResolvedValue(
      buildMockTx({ recipientAddr: '0xwrong_address' }),
    );

    const serverMethod = suiFn({
      currency: USDC,
      recipient: RECIPIENT,
      store: new InMemoryDigestStore(),
    });

    await expect(verifyPayment(serverMethod)).rejects.toThrow(
      'Payment not found',
    );
  });

  it('rejects when amount is less than requested', async () => {
    mockGetTransaction.mockResolvedValue(buildMockTx({ amount: '5000' }));

    const serverMethod = suiFn({
      currency: USDC,
      recipient: RECIPIENT,
      store: new InMemoryDigestStore(),
    });

    await expect(verifyPayment(serverMethod)).rejects.toThrow('Transferred');
  });

  it('accepts a configured non-default currency', async () => {
    const onPayment = vi.fn();
    mockGetTransaction.mockResolvedValue(
      buildMockTx({ coinType: ALT_CURRENCY, amount: '123' }),
    );

    const serverMethod = suiFn({
      currency: { type: ALT_CURRENCY, decimals: 2 },
      recipient: RECIPIENT,
      store: new InMemoryDigestStore(),
      onPayment,
    });

    const credential = buildCredential(
      '0xdigest123',
      '1.23',
      'proof_sig',
      ALT_CURRENCY,
    );
    const result = await verifyPayment(serverMethod, credential);

    expect(result.status).toBe('success');
    expect(onPayment).toHaveBeenCalledWith(
      expect.objectContaining({ currency: ALT_CURRENCY, amount: '1.23' }),
    );
  });

  it('rejects an unconfigured challenge currency', async () => {
    const serverMethod = suiFn({
      currency: USDC,
      recipient: RECIPIENT,
      store: new InMemoryDigestStore(),
    });

    await expect(
      verifyPayment(
        serverMethod,
        buildCredential('0xdigest123', '0.01', 'proof_sig', ALT_CURRENCY),
      ),
    ).rejects.toThrow(`Unsupported currency: ${ALT_CURRENCY}`);
    expect(mockGetTransaction).not.toHaveBeenCalled();
  });

  it('uses configured currency decimals for amount checks', async () => {
    mockGetTransaction.mockResolvedValue(
      buildMockTx({ coinType: ALT_CURRENCY, amount: '122' }),
    );

    const serverMethod = suiFn({
      currency: { type: ALT_CURRENCY, decimals: 2 },
      recipient: RECIPIENT,
      store: new InMemoryDigestStore(),
    });

    await expect(
      verifyPayment(
        serverMethod,
        buildCredential('0xdigest123', '1.23', 'proof_sig', ALT_CURRENCY),
      ),
    ).rejects.toThrow('Transferred 122 < requested 123');
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
      currency: USDC,
      recipient: RECIPIENT,
      store: new InMemoryDigestStore(),
    });

    await expect(verifyPayment(serverMethod)).rejects.toThrow(
      'Payment not found',
    );
  });

  it('rejects when proof signature is invalid', async () => {
    mockGetTransaction.mockResolvedValue(buildMockTx());
    mockVerifyPersonalMessageSignature.mockRejectedValue(
      new Error('bad signature'),
    );

    const store = {
      has: vi.fn().mockResolvedValue(false),
      set: vi.fn(),
    } satisfies DigestStore;
    const serverMethod = suiFn({
      currency: USDC,
      recipient: RECIPIENT,
      store,
    });

    await expect(verifyPayment(serverMethod)).rejects.toThrow(
      'Invalid payment proof signature',
    );
    expect(store.set).not.toHaveBeenCalled();
  });

  it('rejects when proof signer is not the transaction sender', async () => {
    mockGetTransaction.mockResolvedValue(buildMockTx());
    mockVerifyPersonalMessageSignature.mockResolvedValue({
      toSuiAddress: () => '0xthief',
    });

    const store = {
      has: vi.fn().mockResolvedValue(false),
      set: vi.fn(),
    } satisfies DigestStore;
    const serverMethod = suiFn({
      currency: USDC,
      recipient: RECIPIENT,
      store,
    });

    await expect(verifyPayment(serverMethod)).rejects.toThrow(
      'Payment proof signer does not match transaction sender',
    );
    expect(store.set).not.toHaveBeenCalled();
  });

  it('rejects when transaction sender is missing', async () => {
    mockGetTransaction.mockResolvedValue({
      Transaction: {
        digest: '0xdigest123',
        status: { success: true },
        transaction: undefined,
        balanceChanges: [
          { coinType: SUI_USDC_TYPE, address: RECIPIENT, amount: '10000' },
          { coinType: SUI_USDC_TYPE, address: SENDER, amount: '-10000' },
        ],
      },
    });

    const serverMethod = suiFn({
      currency: USDC,
      recipient: RECIPIENT,
      store: new InMemoryDigestStore(),
    });

    await expect(verifyPayment(serverMethod)).rejects.toThrow(
      'Transaction sender not found',
    );
  });
});

describe('digest replay protection', () => {
  let suiFn: typeof createSuiServer;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockVerifyPersonalMessageSignature.mockResolvedValue({
      toSuiAddress: () => SENDER,
    });
    const mod = await import('../../src/server.js');
    suiFn = mod.sui;
  });

  it('accepts a valid digest on first use', async () => {
    const store = new InMemoryDigestStore();
    mockGetTransaction.mockResolvedValue(buildMockTx());

    const serverMethod = suiFn({
      currency: USDC,
      recipient: RECIPIENT,
      store,
    });

    const result = await verifyPayment(serverMethod);

    expect(result.reference).toBe('0xdigest123');
    expect(result.status).toBe('success');
  });

  it('rejects the same digest on second use', async () => {
    const store = new InMemoryDigestStore();
    mockGetTransaction.mockResolvedValue(buildMockTx());

    const serverMethod = suiFn({
      currency: USDC,
      recipient: RECIPIENT,
      store,
    });

    await verifyPayment(serverMethod);

    await expect(
      verifyPayment(serverMethod, buildCredential('0xdigest123', '0.02')),
    ).rejects.toThrow('Digest already used');
  });

  it('accepts a different digest after first is consumed', async () => {
    const store = new InMemoryDigestStore();

    const serverMethod = suiFn({
      currency: USDC,
      recipient: RECIPIENT,
      store,
    });

    mockGetTransaction.mockResolvedValue(buildMockTx());
    await verifyPayment(serverMethod, buildCredential('0xdigest123'));

    mockGetTransaction.mockResolvedValue({
      Transaction: {
        digest: '0xdigest456',
        status: { success: true },
        transaction: {
          sender: SENDER,
        },
        balanceChanges: [
          { coinType: SUI_USDC_TYPE, address: RECIPIENT, amount: '10000' },
          { coinType: SUI_USDC_TYPE, address: SENDER, amount: '-10000' },
        ],
      },
    });

    const result = await verifyPayment(
      serverMethod,
      buildCredential('0xdigest456'),
    );

    expect(result.reference).toBe('0xdigest456');
  });

  it('accepts the same digest after TTL expiry', async () => {
    const store = new InMemoryDigestStore(50);
    mockGetTransaction.mockResolvedValue(buildMockTx());

    const serverMethod = suiFn({
      currency: USDC,
      recipient: RECIPIENT,
      store,
    });

    await verifyPayment(serverMethod);

    await new Promise((r) => setTimeout(r, 100));

    const result = await verifyPayment(serverMethod);
    expect(result.status).toBe('success');
  });

  it('throws on missing store', () => {
    expect(() =>
      // @ts-expect-error Runtime guard protects JavaScript callers too.
      suiFn({ currency: USDC, recipient: RECIPIENT }),
    ).toThrow('DigestStore is required');
  });

  it('marks digest before returning receipt (store.set failure = no free call)', async () => {
    const store = {
      has: vi.fn().mockResolvedValue(false),
      set: vi.fn().mockRejectedValue(new Error('Redis down')),
    } satisfies DigestStore;
    mockGetTransaction.mockResolvedValue(buildMockTx());

    const serverMethod = suiFn({
      currency: USDC,
      recipient: RECIPIENT,
      store,
    });

    await expect(verifyPayment(serverMethod)).rejects.toThrow('Redis down');

    expect(store.set).toHaveBeenCalledWith('0xdigest123');
  });
});
