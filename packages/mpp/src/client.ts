import { Method, Credential } from 'mppx';
import type { ClientWithCoreApi } from '@mysten/sui/client';
import type { Signer } from '@mysten/sui/cryptography';
import { coinWithBalance, Transaction } from '@mysten/sui/transactions';
import { suiCharge } from './method.js';
import { parseAmountToRaw } from './utils.js';

export { suiCharge } from './method.js';
export { SUI_USDC_TYPE } from './constants.js';

export interface SuiChargeOptions {
  client: ClientWithCoreApi;
  signer: Signer;
  /** Number of decimal places for the currency (default: 6, e.g. USDC). */
  decimals?: number;
  /** Override transaction execution (e.g. to route through a gas manager). */
  execute?: (tx: Transaction) => Promise<{ digest: string }>;
}

export function sui(options: SuiChargeOptions) {
  const address = options.signer.toSuiAddress();
  const decimals = options.decimals ?? 6;

  return Method.toClient(suiCharge, {
    async createCredential({ challenge }) {
      const { amount, currency, recipient } = challenge.request;
      const amountRaw = parseAmountToRaw(amount, decimals);

      const tx = new Transaction();
      tx.setSender(address);

      const payment = coinWithBalance({ balance: amountRaw, type: currency });
      tx.transferObjects([payment], recipient);

      let result;
      try {
        if (options.execute) {
          result = await options.execute(tx);
        } else {
          const built = await tx.build({ client: options.client });
          const { signature } = await options.signer.signTransaction(built);
          const execResult = await options.client.core.executeTransaction({
            transaction: built,
            signatures: [signature],
            include: { effects: true },
          });
          if (execResult.FailedTransaction) {
            throw new Error(execResult.FailedTransaction.status.error?.message ?? 'Transaction failed');
          }
          result = execResult.Transaction!;
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new Error(`Payment transaction failed: ${msg}`);
      }

      return Credential.serialize({
        challenge,
        payload: { digest: result.digest },
      });
    },
  });
}
