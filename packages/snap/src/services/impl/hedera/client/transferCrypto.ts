import {
  Hbar,
  TransferTransaction,
  type Client,
  type TransactionReceipt,
} from '@hashgraph/sdk';
import { BigNumber } from 'bignumber.js';

import { AccountBalance, SimpleTransfer } from '../../../hedera';

/**
 * Transfer crypto(hbar or other tokens).
 *
 * @param client - Hedera Client.
 * @param options - Transfer crypto options.
 * @param options.currentBalance - Current Balance to use to retrieve from snap state.
 * @param options.transfers - The list of transfers to take place.
 * @param options.memo - Memo to include in the transfer.
 * @param options.maxFee - Max fee to use in the transfer.
 * @param options.onBeforeConfirm - Function to execute before confirmation.
 */
export async function transferCrypto(
  client: Client,
  options: {
    currentBalance: AccountBalance;
    transfers: SimpleTransfer[];
    memo: string | null;
    maxFee: BigNumber | null; // tinybars
    onBeforeConfirm?: () => void;
  },
): Promise<TransactionReceipt> {
  const transaction = new TransferTransaction();

  let outgoingHbarAmount = 0;
  transaction.setTransactionMemo(options.memo ?? '');
  transaction.setMaxTransactionFee(options.maxFee ?? new Hbar(1));

  for (const transfer of options.transfers) {
    if (transfer.asset === 'HBAR') {
      transaction.addHbarTransfer(
        transfer.to ?? '',
        transfer.amount?.toNumber(),
      );
      outgoingHbarAmount += Number(
        transfer.amount?.negated().toString().replace(' ℏ', ''),
      );
    } else {
      const amount = transfer.amount?.multipliedBy(
        Math.pow(
          10,
          (
            options.currentBalance.tokens.get(
              transfer.asset as string,
            ) as BigNumber
          ).toNumber(),
        ),
      );
      transaction.addTokenTransfer(
        transfer.asset ?? '',
        transfer.to ?? '',
        amount?.toNumber(),
      );
      transaction.addTokenTransfer(
        transfer.asset ?? '',
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        client.operatorAccountId!,
        amount?.negated().toNumber(),
      );
    }
  }

  if (outgoingHbarAmount !== 0) {
    transaction.addHbarTransfer(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      client.operatorAccountId!,
      new Hbar(outgoingHbarAmount),
    );
  }

  const resp = await transaction.execute(client);

  options.onBeforeConfirm?.();

  return await resp.getReceipt(client);
}
