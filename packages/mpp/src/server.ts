import { Method, Receipt } from 'mppx';
import { SuiGrpcClient } from '@mysten/sui/grpc';
import { normalizeSuiAddress } from '@mysten/sui/utils';
import { suiCharge } from './method.js';
import { parseAmountToRaw, withRetry } from './utils.js';

export { suiCharge } from './method.js';
export { SUI_USDC_TYPE } from './constants.js';

export interface SuiServerOptions {
  currency: string;
  recipient: string;
  /** Number of decimal places for the currency (default: 6, e.g. USDC). */
  decimals?: number;
  rpcUrl?: string;
  network?: 'mainnet' | 'testnet' | 'devnet';
  /** URL to report verified payments to (e.g. https://suimpp.dev/api/report). Fire-and-forget POST after successful verification. */
  registryUrl?: string;
  /** Public URL of the server (e.g. https://mpp.t2000.ai). Sent with payment reports for server identification. */
  serverUrl?: string;
}

export function sui(options: SuiServerOptions) {
  const network = options.network ?? 'mainnet';
  const decimals = options.decimals ?? 6;
  const client = new SuiGrpcClient({
    baseUrl: options.rpcUrl ?? `https://fullnode.${network}.sui.io:443`,
    network,
  });

  const normalizedRecipient = normalizeSuiAddress(options.recipient);

  return Method.toServer(suiCharge, {
    defaults: {
      currency: options.currency,
      recipient: options.recipient,
    },

    async verify({ credential }) {
      const digest = credential.payload.digest;

      const tx = await withRetry(
        () => client.core.getTransaction({ digest, include: { balanceChanges: true } }),
      ).catch(() => {
        throw new Error(`Could not find the referenced transaction [${digest}]`);
      });

      const resolved = tx.Transaction ?? tx.FailedTransaction;
      if (!resolved?.status.success) {
        throw new Error('Transaction failed on-chain');
      }

      const payment = resolved.balanceChanges.find(
        (bc) =>
          bc.coinType === options.currency &&
          normalizeSuiAddress(bc.address) === normalizedRecipient &&
          BigInt(bc.amount) > 0n,
      );

      if (!payment) {
        throw new Error(
          'Payment not found in transaction balance changes',
        );
      }

      const transferredRaw = BigInt(payment.amount);
      const requestedRaw = parseAmountToRaw(credential.challenge.request.amount, decimals);
      if (transferredRaw < requestedRaw) {
        throw new Error(
          `Transferred ${transferredRaw} < requested ${requestedRaw} (raw units)`,
        );
      }

      const receipt = Receipt.from({
        method: 'sui',
        reference: credential.payload.digest,
        status: 'success',
        timestamp: new Date().toISOString(),
      });

      if (options.registryUrl) {
        fetch(options.registryUrl, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            digest,
            sender: resolved.balanceChanges.find(
              (bc) => bc.coinType === options.currency && BigInt(bc.amount) < 0n,
            )?.address,
            recipient: options.recipient,
            amount: credential.challenge.request.amount,
            currency: options.currency,
            network,
            serverUrl: options.serverUrl,
          }),
        }).catch(() => {});
      }

      return receipt;
    },
  });
}
