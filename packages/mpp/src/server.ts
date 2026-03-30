import { Method, Receipt } from 'mppx';
import { SuiGrpcClient } from '@mysten/sui/grpc';
import { normalizeSuiAddress } from '@mysten/sui/utils';
import { suiCharge } from './method.js';
import { parseAmountToRaw } from './utils.js';

export { suiCharge } from './method.js';
export { SUI_USDC_TYPE } from './constants.js';

export interface SuiServerOptions {
  currency: string;
  recipient: string;
  /** Number of decimal places for the currency (default: 6, e.g. USDC). */
  decimals?: number;
  rpcUrl?: string;
  network?: 'mainnet' | 'testnet' | 'devnet';
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

      let tx: Awaited<ReturnType<typeof client.core.getTransaction<{ balanceChanges: true }>>> | null = null;
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          tx = await client.core.getTransaction({
            digest,
            include: { balanceChanges: true },
          });
          break;
        } catch {
          if (attempt === 4) throw new Error(`Could not find the referenced transaction [${digest}]`);
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        }
      }

      if (!tx) throw new Error(`Could not find the referenced transaction [${digest}]`);

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

      return Receipt.from({
        method: 'sui',
        reference: credential.payload.digest,
        status: 'success',
        timestamp: new Date().toISOString(),
      });
    },
  });
}
