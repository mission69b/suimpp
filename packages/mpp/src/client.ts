import type { ClientWithCoreApi } from '@mysten/sui/client';
import type { Signer } from '@mysten/sui/cryptography';
import { Transaction } from '@mysten/sui/transactions';
import { Credential, Method } from 'mppx';
import type { Currency } from './constants.js';
import { suiCharge } from './method.js';
import { createSuiPaymentProofBytes } from './proof.js';
import { parseAmountToRaw } from './utils.js';

export { suiCharge } from './method.js';
export {
  SUI_DOLLAR,
  SUI_DOLLAR_TYPE,
  SUI_USDC_TESTNET_TYPE,
  SUI_USDC_TYPE,
  USDC,
  USDC_TESTNET,
} from './constants.js';
export type { Currency } from './constants.js';

export interface SuiChargeOptions {
  client: ClientWithCoreApi;
  signer: Signer;
  currency: Currency;
  /** Override transaction execution (e.g. to route through a gas manager). */
  execute?: (tx: Transaction) => Promise<{ digest: string }>;
}

type TransactionResult = { digest: string };

export function sui(options: SuiChargeOptions) {
  if (!options.currency) {
    throw new Error('[suimpp] Currency is required');
  }

  return Method.toClient(suiCharge, {
    async createCredential({ challenge }) {
      const { amount, currency, recipient } = challenge.request;
      if (currency !== options.currency.type) {
        throw new Error(`Unsupported currency: ${currency}`);
      }
      const amountRaw = parseAmountToRaw(amount, options.currency.decimals);

      const tx = new Transaction();
      tx.setSender(options.signer.toSuiAddress());

      // `send_funds` so that the recipient receives the balance in ABs (not coins)
      tx.moveCall({
        target: '0x2::balance::send_funds',
        arguments: [
          tx.balance({ type: options.currency.type, balance: amountRaw }),
          tx.pure.address(recipient),
        ],
        typeArguments: [options.currency.type],
      });

      let result: TransactionResult;
      try {
        if (options.execute) {
          result = await options.execute(tx);
        } else {
          const execResult =
            await options.client.core.signAndExecuteTransaction({
              transaction: await tx.build({ client: options.client }),
              signer: options.signer,
              include: { effects: true },
            });
          if (execResult.FailedTransaction) {
            throw new Error(
              execResult.FailedTransaction.status.error?.message ??
                'Transaction failed',
            );
          }
          if (!execResult.Transaction) {
            throw new Error('Transaction failed');
          }
          result = execResult.Transaction;
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new Error(`Payment transaction failed: ${msg}`);
      }

      const proof = await options.signer.signPersonalMessage(
        createSuiPaymentProofBytes({
          challenge,
          digest: result.digest,
        }),
      );

      return Credential.serialize({
        challenge,
        payload: {
          digest: result.digest,
          signature: proof.signature,
        },
      });
    },
  });
}
