import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { SUI_TYPE_ARG } from '@mysten/sui/utils';
import { Challenge, Credential } from 'mppx';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { sui as createSuiClient } from '../../src/client.js';
import { InMemoryDigestStore } from '../../src/in-memory-digest-store.js';
import { suiCharge } from '../../src/method.js';
import { createSuiPaymentProofBytes } from '../../src/proof.js';
import {
  type PaymentReport,
  SUI_USDC_TYPE,
  sui as createSuiServer,
} from '../../src/server.js';
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
  { digest: string; signature: string },
  SuiChargeChallenge
>;

describe('Sui localnet e2e payment', () => {
  const localnetClient = getClient();
  const payerKeypair = Ed25519Keypair.generate();
  const thiefKeypair = Ed25519Keypair.generate();
  const recipientKeypair = Ed25519Keypair.generate();
  const recipient = recipientKeypair.getPublicKey().toSuiAddress();

  beforeAll(async () => {
    await fundAddress(payerKeypair.getPublicKey().toSuiAddress());
  });

  function buildChallenge(id: string): SuiChargeChallenge {
    return Challenge.fromMethod(suiCharge, {
      id,
      realm: 'suimpp-e2e',
      request: {
        amount: PAYMENT_AMOUNT,
        currency: SUI_TYPE_ARG,
        recipient,
      },
    }) as SuiChargeChallenge;
  }

  function buildServerMethod(onPayment?: (report: PaymentReport) => void) {
    return createSuiServer({
      currency: { type: SUI_TYPE_ARG, decimals: SUI_DECIMALS },
      recipient,
      rpcUrl: getFullnodeUrl(),
      network: 'localnet',
      store: new InMemoryDigestStore(),
      onPayment,
    });
  }

  async function createCredential(challenge: SuiChargeChallenge) {
    const clientMethod = createSuiClient({
      client: localnetClient,
      signer: payerKeypair,
      currency: { type: SUI_TYPE_ARG, decimals: SUI_DECIMALS },
    });
    const authorization = await clientMethod.createCredential({ challenge });
    const credential = Credential.deserialize<{ digest: string }>(
      authorization,
    ) as SuiChargeCredential;

    await localnetClient.waitForTransaction({
      digest: credential.payload.digest,
    });

    return credential;
  }

  it('creates an on-chain credential and verifies the payment once', async () => {
    const onPayment = vi.fn();
    const challenge = buildChallenge('sui-localnet-e2e-payment');
    const serverMethod = buildServerMethod(onPayment);
    const credential = await createCredential(challenge);

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

  it('rejects a stolen proof signed by a different key', async () => {
    const challenge = buildChallenge('sui-localnet-e2e-stolen-proof');
    const serverMethod = buildServerMethod();
    const credential = await createCredential(challenge);

    const stolenProof = await thiefKeypair.signPersonalMessage(
      createSuiPaymentProofBytes({
        challenge,
        digest: credential.payload.digest,
      }),
    );
    const stolenCredential: SuiChargeCredential = {
      ...credential,
      payload: {
        ...credential.payload,
        signature: stolenProof.signature,
      },
    };

    await expect(
      serverMethod.verify({
        credential: stolenCredential,
        request: challenge.request,
      }),
    ).rejects.toThrow('Payment proof signer does not match transaction sender');
  });

  it('rejects a payment made with the wrong currency', async () => {
    const challenge = buildChallenge('sui-localnet-e2e-wrong-currency');
    const credential = await createCredential(challenge);
    const serverMethod = createSuiServer({
      currency: { type: SUI_USDC_TYPE, decimals: 6 },
      recipient,
      rpcUrl: getFullnodeUrl(),
      network: 'localnet',
      store: new InMemoryDigestStore(),
    });

    await expect(
      serverMethod.verify({
        credential,
        request: challenge.request,
      }),
    ).rejects.toThrow(`Unsupported currency: ${SUI_TYPE_ARG}`);
  });
});
