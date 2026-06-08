import { SuiGrpcClient } from '@mysten/sui/grpc';
import { getJsonRpcFullnodeUrl } from '@mysten/sui/jsonRpc';
import { normalizeSuiAddress } from '@mysten/sui/utils';
import { verifyPersonalMessageSignature } from '@mysten/sui/verify';
import { Method, Receipt } from 'mppx';
import type { Currency } from './constants.js';
import { suiCharge } from './method.js';
import { createSuiPaymentProofBytes } from './proof.js';
import { parseAmountToRaw, withRetry } from './utils.js';

export { suiCharge } from './method.js';
export { InMemoryDigestStore } from './in-memory-digest-store.js';
export {
  SUI_DOLLAR,
  SUI_DOLLAR_TYPE,
  SUI_USDC_TESTNET_TYPE,
  SUI_USDC_TYPE,
  USDC,
  USDC_TESTNET,
} from './constants.js';
export type { Currency } from './constants.js';

export interface DigestStore {
  has(digest: string): Promise<boolean>;
  set(digest: string): Promise<void>;
}

export interface PaymentReport {
  digest: string;
  sender?: string;
  recipient: string;
  amount: string;
  currency: string;
  network: string;
}

export interface SuiServerOptions {
  currency: Currency;
  recipient: string;
  rpcUrl?: string;
  network?: 'mainnet' | 'testnet' | 'devnet' | 'localnet';
  /** Digest store for replay protection. Use a shared durable store in production. */
  store: DigestStore;
  /** Called after successful on-chain verification with payment data. */
  onPayment?: (report: PaymentReport) => void;
}

function resolveStore(options: SuiServerOptions): DigestStore {
  if (!options.store) {
    throw new Error(
      '[suimpp] DigestStore is required. ' +
        'Provide a Redis or DB-backed store via SuiServerOptions.store. ' +
        'Use InMemoryDigestStore explicitly only for local development or tests.',
    );
  }
  if (!options.store.has || typeof options.store.has !== 'function') {
    throw new Error('[suimpp] DigestStore must implement has method');
  }
  if (!options.store.set || typeof options.store.set !== 'function') {
    throw new Error('[suimpp] DigestStore must implement set method');
  }
  return options.store;
}

export function sui(options: SuiServerOptions) {
  if (!options.currency) {
    throw new Error('[suimpp] Currency is required');
  }

  const network = options.network ?? 'mainnet';
  const baseUrl = options.rpcUrl ?? getJsonRpcFullnodeUrl(network);
  const client = new SuiGrpcClient({
    baseUrl,
    network,
  });

  const normalizedRecipient = normalizeSuiAddress(options.recipient);
  const digestStore = resolveStore(options);

  return Method.toServer(suiCharge, {
    defaults: {
      currency: options.currency.type,
      recipient: options.recipient,
    },

    async verify({ credential }) {
      const digest = credential.payload.digest;
      if (credential.challenge.request.currency !== options.currency.type) {
        throw new Error(
          `Unsupported currency: ${credential.challenge.request.currency}`,
        );
      }

      const alreadyUsed = await digestStore.has(digest);
      if (alreadyUsed) {
        throw new Error(
          `Digest already used: ${digest}. Each transaction can only pay for one API call.`,
        );
      }

      const tx = await withRetry(() =>
        client.core.getTransaction({
          digest,
          include: { balanceChanges: true, transaction: true },
        }),
      ).catch(() => {
        throw new Error(
          `Could not find the referenced transaction [${digest}]`,
        );
      });

      const resolved = tx.Transaction ?? tx.FailedTransaction;
      if (!resolved?.status.success) {
        throw new Error('Transaction failed on-chain');
      }

      const payment = resolved.balanceChanges.find(
        (bc) =>
          bc.coinType === options.currency.type &&
          normalizeSuiAddress(bc.address) === normalizedRecipient &&
          BigInt(bc.amount) > 0n,
      );

      if (!payment) {
        throw new Error('Payment not found in transaction balance changes');
      }

      const transferredRaw = BigInt(payment.amount);
      const requestedRaw = parseAmountToRaw(
        credential.challenge.request.amount,
        options.currency.decimals,
      );
      if (transferredRaw < requestedRaw) {
        throw new Error(
          `Transferred ${transferredRaw} < requested ${requestedRaw} (raw units)`,
        );
      }

      // Pass the client so zkLogin payment proofs verify. zkLogin signatures
      // (e.g. Audric's browser wallet) can only be verified with a client to
      // resolve the proof against the current epoch/JWK; Ed25519/Secp proofs
      // (e.g. a local keypair) ignore it. Without it, every zkLogin payment
      // fails closed as "Invalid payment proof signature". The original cause
      // is preserved for gateway-side debugging.
      const publicKey = await verifyPersonalMessageSignature(
        createSuiPaymentProofBytes({
          challenge: credential.challenge,
          digest,
        }),
        credential.payload.signature,
        { client },
      ).catch((cause) => {
        throw new Error('Invalid payment proof signature', { cause });
      });
      const sender = resolved.transaction?.sender;
      if (!sender) {
        throw new Error('Transaction sender not found');
      }
      if (
        normalizeSuiAddress(publicKey.toSuiAddress()) !==
        normalizeSuiAddress(sender)
      ) {
        throw new Error(
          'Payment proof signer does not match transaction sender',
        );
      }

      await digestStore.set(digest);

      const receipt = Receipt.from({
        method: 'sui',
        reference: credential.payload.digest,
        status: 'success',
        timestamp: new Date().toISOString(),
      });

      const report: PaymentReport = {
        digest,
        sender,
        recipient: options.recipient,
        amount: credential.challenge.request.amount,
        currency: options.currency.type,
        network,
      };

      if (options.onPayment) {
        try {
          options.onPayment(report);
        } catch {}
      }

      return receipt;
    },
  });
}
