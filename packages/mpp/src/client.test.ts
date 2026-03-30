import { describe, it, expect, vi, beforeEach } from 'vitest';

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
  signTransaction: vi.fn().mockResolvedValue({ bytes: 'mock_bytes', signature: 'mock_sig' }),
};

describe('client createCredential', () => {
  let suiFn: typeof import('./client.js').sui;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import('./client.js');
    suiFn = mod.sui;
  });

  it('builds transaction with coinWithBalance and executes it', async () => {
    mockExecuteTransaction.mockResolvedValue({
      Transaction: { digest: '0xtxdigest' },
    });

    const clientMethod = suiFn({
      client: mockClient as any,
      signer: mockSigner as any,
    });

    const challenge = {
      request: {
        amount: '0.01',
        currency: '0x::usdc::USDC',
        recipient: '0xrecipient',
      },
    };

    try {
      await (clientMethod as any).createCredential({ challenge });
    } catch {
      // Credential.serialize may not be available in test — we're testing TX building
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
      client: mockClient as any,
      signer: mockSigner as any,
    });

    const challenge = {
      request: {
        amount: '0.01',
        currency: '0x::usdc::USDC',
        recipient: '0xrecipient',
      },
    };

    await expect(
      (clientMethod as any).createCredential({ challenge }),
    ).rejects.toThrow('Payment transaction failed');
  });

  it('uses custom execute when provided', async () => {
    const customExecute = vi.fn().mockResolvedValue({ digest: '0xcustom', effects: {} });

    const clientMethod = suiFn({
      client: mockClient as any,
      signer: mockSigner as any,
      execute: customExecute,
    });

    const challenge = {
      request: {
        amount: '1.00',
        currency: '0x::usdc::USDC',
        recipient: '0xrecipient',
      },
    };

    try {
      await (clientMethod as any).createCredential({ challenge });
    } catch {
      // Credential.serialize may not be available in test
    }

    expect(customExecute).toHaveBeenCalled();
    expect(mockExecuteTransaction).not.toHaveBeenCalled();
  });
});
