import {
  Hbar,
  TransactionRecord,
  TransferTransaction,
  type Client,
} from '@hashgraph/sdk';

import {
  AccountBalance,
  SimpleTransfer,
  TokenBalance,
  TxRecord,
  TxTransfer,
} from '../../../hedera';

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
    maxFee: number | null; // tinybars
    onBeforeConfirm?: () => void;
  },
): Promise<TxRecord> {
  const transaction = new TransferTransaction();

  let outgoingHbarAmount = 0;
  transaction.setTransactionMemo(options.memo ?? '');
  transaction.setMaxTransactionFee(options.maxFee ?? new Hbar(1));

  for (const transfer of options.transfers) {
    if (transfer.asset === 'HBAR') {
      transaction.addHbarTransfer(transfer.to ?? '', transfer.amount);
      if (transfer.amount !== undefined) {
        outgoingHbarAmount += -transfer.amount;
      }
    } else {
      let amount: number | undefined;

      if (transfer.amount !== undefined) {
        const multiplier = Math.pow(
          10,
          (
            options.currentBalance.tokens.get(
              transfer.asset as string,
            ) as TokenBalance
          )?.decimals,
        );
        amount = transfer.amount * multiplier;
      }

      transaction.addTokenTransfer(
        transfer.asset ?? '',
        transfer.to ?? '',
        amount,
      );

      const negatedAmount = amount === undefined ? undefined : -amount;

      transaction.addTokenTransfer(
        transfer.asset ?? '',
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        client.operatorAccountId!,
        negatedAmount,
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

  const txResponse = await transaction.execute(client);

  const record: TransactionRecord = await txResponse.getVerboseRecord(client);

  const uint8ArrayToHex = (data: Uint8Array | null | undefined) => {
    if (!data) {
      return '';
    }
    return data.reduce(
      (str, byte) => str + byte.toString(16).padStart(2, '0'),
      '',
    );
  };

  const transfers: TxTransfer[] = record.transfers.map((transfer) => ({
    accountId: transfer.accountId.toString(),
    amount: transfer.amount.toString(),
    isApproved: transfer.isApproved,
  }));

  const paidStakingRewards: TxTransfer[] = record.paidStakingRewards.map(
    (reward) => ({
      accountId: reward.accountId.toString(),
      amount: reward.amount.toString(),
      isApproved: reward.isApproved,
    }),
  );
  return {
    transactionHash: uint8ArrayToHex(record.transactionHash),
    consensusTimestamp: record.consensusTimestamp.toDate().toISOString(),
    transactionId: record.transactionId.toString(),
    transactionMemo: record.transactionMemo.toString(),
    transactionFee: record.transactionFee.toString(),
    transfers,
    contractFunctionResult: record.contractFunctionResult
      ? JSON.parse(JSON.stringify(record.contractFunctionResult))
      : null, // TODO
    tokenTransfers: JSON.parse(JSON.stringify(record.tokenTransfers)), // TODO
    tokenTransfersList: JSON.parse(JSON.stringify(record.tokenTransfersList)), // TODO
    scheduleRef: record.scheduleRef
      ? record.scheduleRef.toSolidityAddress()
      : '',
    assessedCustomFees: JSON.parse(JSON.stringify(record.assessedCustomFees)), // TODO
    nftTransfers: JSON.parse(JSON.stringify(record.nftTransfers)), // TODO
    automaticTokenAssociations: JSON.parse(
      JSON.stringify(record.automaticTokenAssociations),
    ), // TODO
    parentConsensusTimestamp: record.parentConsensusTimestamp
      ? record.parentConsensusTimestamp.toDate().toISOString()
      : '',
    aliasKey: record.aliasKey ? record.aliasKey.toStringRaw() : '',
    ethereumHash: uint8ArrayToHex(record.ethereumHash),
    paidStakingRewards,
    prngBytes: uint8ArrayToHex(record.prngBytes),
    prngNumber: record.prngNumber,
    evmAddress: uint8ArrayToHex(record.evmAddress?.toBytes()),
  } as TxRecord;
}
