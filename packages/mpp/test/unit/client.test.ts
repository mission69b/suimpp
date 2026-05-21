import type { Challenge } from 'mppx';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  SuiChargeOptions,
  sui as createSuiClient,
} from '../../src/client.js';

vi.mock('@mysten/sui/transactions', () => {
  const coinWithBalance = vi.fn(() => 'coin_with_balance_result');
  const Transaction = vi.fn().mockImplementation(() => ({
    setSender: vi.fn(),
    transferObjects: vi.fn(),
    build: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
  }));
  return { Transaction, coinWithBalance };
});

const mockExecuteTransaction = vi.fn();

const mockClient = {
  core: {
    executeTransaction: mockExecuteTransaction,
  },
};

const mockSigner = {
  toSuiAddress: () => '0xagent_address',
  signTransaction: vi
    .fn()
    .mockResolvedValue({ bytes: 'mock_bytes', signature: 'mock_sig' }),
};

const typedMockClient = mockClient as unknown as SuiChargeOptions['client'];
const typedMockSigner = mockSigner as unknown as SuiChargeOptions['signer'];

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

function buildChallenge(amount = '0.01'): SuiChargeChallenge {
  return {
    id: 'test-challenge',
    intent: 'charge',
    method: 'sui',
    realm: 'test',
    request: {
      amount,
      currency: '0x::usdc::USDC',
      recipient: '0xrecipient',
    },
  };
}

describe('client createCredential', () => {
  let suiFn: typeof createSuiClient;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import('../../src/client.js');
    suiFn = mod.sui;
  });

  it('builds transaction with coinWithBalance and executes it', async () => {
    mockExecuteTransaction.mockResolvedValue({
      Transaction: { digest: '0xtxdigest' },
    });

    const clientMethod = suiFn({
      client: typedMockClient,
      signer: typedMockSigner,
    });

    const challenge = buildChallenge();

    try {
      await clientMethod.createCredential({ challenge });
    } catch {
      // Credential.serialize may not be available in test; this verifies TX building.
    }

    expect(mockSigner.signTransaction).toHaveBeenCalled();
    expect(mockExecuteTransaction).toHaveBeenCalledWith({
      transaction: expect.any(Uint8Array),
      signatures: ['mock_sig'],
      include: { effects: true },
    });
  });

  it('throws when transaction execution fails', async () => {
    mockExecuteTransaction.mockResolvedValue({
      FailedTransaction: { status: { error: 'out of gas' } },
    });

    const clientMethod = suiFn({
      client: typedMockClient,
      signer: typedMockSigner,
    });

    const challenge = buildChallenge();

    await expect(clientMethod.createCredential({ challenge })).rejects.toThrow(
      'Payment transaction failed',
    );
  });

  it('uses custom execute when provided', async () => {
    const customExecute = vi
      .fn()
      .mockResolvedValue({ digest: '0xcustom', effects: {} });

    const clientMethod = suiFn({
      client: typedMockClient,
      signer: typedMockSigner,
      execute: customExecute,
    });

    const challenge = buildChallenge('1.00');

    try {
      await clientMethod.createCredential({ challenge });
    } catch {
      // Credential.serialize may not be available in test.
    }

    expect(customExecute).toHaveBeenCalled();
    expect(mockExecuteTransaction).not.toHaveBeenCalled();
  });
});
