import type { Challenge } from 'mppx';
import { Credential } from 'mppx';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  SuiChargeOptions,
  sui as createSuiClient,
} from '../../src/client.js';

const { mockBalance, mockBuild, mockMoveCall, mockPureAddress } = vi.hoisted(
  () => ({
    mockBalance: vi.fn(() => 'balance_result'),
    mockBuild: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
    mockMoveCall: vi.fn(),
    mockPureAddress: vi.fn(() => 'recipient_address_result'),
  }),
);

vi.mock('@mysten/sui/transactions', () => {
  const Transaction = vi.fn().mockImplementation(() => ({
    setSender: vi.fn(),
    balance: mockBalance,
    pure: {
      address: mockPureAddress,
    },
    moveCall: mockMoveCall,
    build: mockBuild,
  }));
  return { Transaction };
});

const mockSignAndExecuteTransaction = vi.fn();

const mockClient = {
  core: {
    signAndExecuteTransaction: mockSignAndExecuteTransaction,
  },
};

const mockSigner = {
  toSuiAddress: () => '0xagent_address',
  signPersonalMessage: vi
    .fn()
    .mockResolvedValue({ bytes: 'proof_bytes', signature: 'proof_sig' }),
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
const USDC = { type: '0x::usdc::USDC', decimals: 6 };

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

  it('builds transaction with send_funds and executes it', async () => {
    mockSignAndExecuteTransaction.mockResolvedValue({
      Transaction: { digest: '0xtxdigest' },
    });

    const clientMethod = suiFn({
      client: typedMockClient,
      signer: typedMockSigner,
      currency: USDC,
    });

    const challenge = buildChallenge();

    const authorization = await clientMethod.createCredential({ challenge });
    const credential = Credential.deserialize<{
      digest: string;
      signature: string;
    }>(authorization);

    expect(mockSigner.signPersonalMessage).toHaveBeenCalledWith(
      expect.any(Uint8Array),
    );
    expect(mockMoveCall).toHaveBeenCalledWith({
      target: '0x2::balance::send_funds',
      arguments: ['balance_result', 'recipient_address_result'],
      typeArguments: ['0x::usdc::USDC'],
    });
    expect(mockBuild).toHaveBeenCalledWith({ client: typedMockClient });
    expect(mockSignAndExecuteTransaction).toHaveBeenCalledWith({
      transaction: expect.any(Uint8Array),
      signer: typedMockSigner,
      include: { effects: true },
    });
    expect(credential.payload).toEqual({
      digest: '0xtxdigest',
      signature: 'proof_sig',
    });
  });

  it('throws when transaction execution fails', async () => {
    mockSignAndExecuteTransaction.mockResolvedValue({
      FailedTransaction: { status: { error: 'out of gas' } },
    });

    const clientMethod = suiFn({
      client: typedMockClient,
      signer: typedMockSigner,
      currency: USDC,
    });

    const challenge = buildChallenge();

    await expect(clientMethod.createCredential({ challenge })).rejects.toThrow(
      'Payment transaction failed',
    );
  });

  it('uses decimals from configured Currency', async () => {
    mockSignAndExecuteTransaction.mockResolvedValue({
      Transaction: { digest: '0xtxdigest' },
    });

    const clientMethod = suiFn({
      client: typedMockClient,
      signer: typedMockSigner,
      currency: { type: '0x::usdc::USDC', decimals: 2 },
    });

    await clientMethod.createCredential({
      challenge: buildChallenge('1.23'),
    });

    expect(mockBalance).toHaveBeenCalledWith({
      balance: 123n,
      type: '0x::usdc::USDC',
    });
  });

  it('requires configured currency metadata', async () => {
    mockSignAndExecuteTransaction.mockResolvedValue({
      Transaction: { digest: '0xtxdigest' },
    });

    expect(() =>
      // @ts-expect-error Runtime guard protects JavaScript callers too.
      suiFn({ client: typedMockClient, signer: typedMockSigner }),
    ).toThrow('Currency is required');
  });

  it('rejects an unsupported configured currency', async () => {
    const clientMethod = suiFn({
      client: typedMockClient,
      signer: typedMockSigner,
      currency: { type: '0x::eurc::EURC', decimals: 6 },
    });

    await expect(
      clientMethod.createCredential({ challenge: buildChallenge() }),
    ).rejects.toThrow('Unsupported currency: 0x::usdc::USDC');
  });

  it('uses custom execute when provided', async () => {
    const customExecute = vi
      .fn()
      .mockResolvedValue({ digest: '0xcustom', effects: {} });

    const clientMethod = suiFn({
      client: typedMockClient,
      signer: typedMockSigner,
      currency: USDC,
      execute: customExecute,
    });

    const challenge = buildChallenge('1.00');

    const authorization = await clientMethod.createCredential({ challenge });
    const credential = Credential.deserialize<{
      digest: string;
      signature: string;
    }>(authorization);

    expect(customExecute).toHaveBeenCalled();
    expect(mockSigner.signPersonalMessage).toHaveBeenCalledWith(
      expect.any(Uint8Array),
    );
    expect(mockSignAndExecuteTransaction).not.toHaveBeenCalled();
    expect(credential.payload).toMatchObject({
      digest: '0xcustom',
      signature: 'proof_sig',
    });
  });
});
