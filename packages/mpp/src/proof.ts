import type { Challenge } from 'mppx';

export interface SuiPaymentProofMessage {
  challenge: Challenge.Challenge<
    {
      amount: string;
      currency: string;
      recipient: string;
    },
    'charge',
    'sui'
  >;
  digest: string;
}

const textEncoder = new TextEncoder();

export function createSuiPaymentProofMessage({
  challenge,
  digest,
}: SuiPaymentProofMessage): string {
  return JSON.stringify({
    domain: 'suimpp.sui.payment-proof',
    version: 1,
    method: challenge.method,
    intent: challenge.intent,
    challengeId: challenge.id,
    amount: challenge.request.amount,
    currency: challenge.request.currency,
    recipient: challenge.request.recipient,
    digest,
  });
}

export function createSuiPaymentProofBytes(
  message: SuiPaymentProofMessage,
): Uint8Array {
  return textEncoder.encode(createSuiPaymentProofMessage(message));
}
