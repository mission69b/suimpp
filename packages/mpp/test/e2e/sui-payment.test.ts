import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { SUI_TYPE_ARG } from '@mysten/sui/utils';
import { Challenge, Credential } from 'mppx';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { sui as createSuiClient } from '../../src/client.js';
import { InMemoryDigestStore } from '../../src/in-memory-digest-store.js';
import { suiCharge } from '../../src/method.js';
import { sui as createSuiServer } from '../../src/server.js';
import { fundAddress, getClient, getFullnodeUrl } from './setup.js';

const PAYMENT_AMOUNT = '0.01';
const SUI_DECIMALS = 9;

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
type SuiChargeCredential = Credential.Credential<
  { digest: string },
  SuiChargeChallenge
>;

describe('Sui localnet e2e payment', () => {
  const localnetClient = getClient();
  const payerKeypair = Ed25519Keypair.generate();
  const recipientKeypair = Ed25519Keypair.generate();
  const recipient = recipientKeypair.getPublicKey().toSuiAddress();

  beforeAll(async () => {
    await fundAddress(payerKeypair.getPublicKey().toSuiAddress());
  });

  it('creates an on-chain credential and verifies the payment once', async () => {
    const onPayment = vi.fn();
    const challenge = Challenge.fromMethod(suiCharge, {
      id: 'sui-localnet-e2e-payment',
      realm: 'suimpp-e2e',
      request: {
        amount: PAYMENT_AMOUNT,
        currency: SUI_TYPE_ARG,
        recipient,
      },
    }) as SuiChargeChallenge;
    const clientMethod = createSuiClient({
      client: localnetClient,
      signer: payerKeypair,
      decimals: SUI_DECIMALS,
    });
    const serverMethod = createSuiServer({
      currency: SUI_TYPE_ARG,
      recipient,
      decimals: SUI_DECIMALS,
      rpcUrl: getFullnodeUrl(),
      network: 'localnet',
      store: new InMemoryDigestStore(),
      onPayment,
    });

    const authorization = await clientMethod.createCredential({ challenge });
    const credential = Credential.deserialize<{ digest: string }>(
      authorization,
    ) as SuiChargeCredential;
    await localnetClient.waitForTransaction({
      digest: credential.payload.digest,
    });

    const receipt = await serverMethod.verify({
      credential,
      request: challenge.request,
    });

    expect(receipt).toMatchObject({
      method: 'sui',
      reference: credential.payload.digest,
      status: 'success',
    });
    expect(onPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        digest: credential.payload.digest,
        recipient,
        amount: PAYMENT_AMOUNT,
        currency: SUI_TYPE_ARG,
        network: 'localnet',
      }),
    );

    await expect(
      serverMethod.verify({
        credential,
        request: challenge.request,
      }),
    ).rejects.toThrow('Digest already used');
  });
});
