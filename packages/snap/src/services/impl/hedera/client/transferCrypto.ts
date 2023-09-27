import {
  Hbar,
  TransactionRecord,
  TransferTransaction,
  type Client,
} from '@hashgraph/sdk';

import {
  AccountBalance,
  SimpleTransfer,
  TxReceipt,
  TxReceiptExchangeRate,
  TxRecord,
  TxRecordTransfer,
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
  transaction.setMaxTransactionFee(new Hbar(options.maxFee) ?? new Hbar(1));

  for (const transfer of options.transfers) {
    if (transfer.asset === 'HBAR') {
      transaction.addHbarTransfer(transfer.to, transfer.amount);
      if (transfer.amount !== undefined) {
        outgoingHbarAmount += -transfer.amount;
      }
    } else {
      const multiplier = Math.pow(
        10,
        options.currentBalance.tokens[transfer.asset].decimals,
      );
      const amount = transfer.amount * multiplier;

      transaction.addTokenTransfer(
        transfer.asset,
        transfer.to,
        transfer.amount,
      );

      transaction.addTokenTransfer(
        transfer.asset,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        client.operatorAccountId!,
        -amount,
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

  transaction.freezeWith(client);

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

  /*   const mapToObject = (map: Map<string, any>) => {
    const obj: { [key: string]: any } = {};
    map.forEach((value, key) => {
      obj[key] = value;
    });
    return obj;
  }; */

  const transfers: TxRecordTransfer[] = record.transfers.map((transfer) => ({
    accountId: transfer.accountId.toString(),
    amount: transfer.amount.toString(),
    isApproved: transfer.isApproved,
  }));

  const paidStakingRewards: TxRecordTransfer[] = record.paidStakingRewards.map(
    (reward) => ({
      accountId: reward.accountId.toString(),
      amount: reward.amount.toString(),
      isApproved: reward.isApproved,
    }),
  );
  return {
    receipt: {
      status: record.receipt.status.toString(),
      accountId: record.receipt.accountId
        ? record.receipt.accountId.toString()
        : '',
      fileId: record.receipt.fileId ? record.receipt.fileId : '',
      contractId: record.receipt.contractId ? record.receipt.contractId : '',
      topicId: record.receipt.topicId ? record.receipt.topicId : '',
      tokenId: record.receipt.tokenId ? record.receipt.tokenId : '',
      scheduleId: record.receipt.scheduleId ? record.receipt.scheduleId : '',
      exchangeRate: record.receipt.exchangeRate
        ? (JSON.parse(
            JSON.stringify(record.receipt.exchangeRate),
          ) as TxReceiptExchangeRate)
        : ({} as TxReceiptExchangeRate),
      topicSequenceNumber: record.receipt.topicSequenceNumber
        ? String(record.receipt.topicSequenceNumber)
        : '',
      topicRunningHash: uint8ArrayToHex(record.receipt.topicRunningHash),
      totalSupply: record.receipt.totalSupply
        ? String(record.receipt.totalSupply)
        : '',
      scheduledTransactionId: record.receipt.scheduledTransactionId
        ? record.receipt.scheduledTransactionId.toString()
        : '',
      serials: JSON.parse(JSON.stringify(record.receipt.serials)),
      duplicates: JSON.parse(JSON.stringify(record.receipt.duplicates)),
      children: JSON.parse(JSON.stringify(record.receipt.children)),
    } as TxReceipt,
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
    duplicates: JSON.parse(JSON.stringify(record.duplicates)),
    children: JSON.parse(JSON.stringify(record.children)),
    ethereumHash: uint8ArrayToHex(record.ethereumHash),
    paidStakingRewards,
    prngBytes: uint8ArrayToHex(record.prngBytes),
    prngNumber: record.prngNumber ? record.prngNumber.toString() : '',
    evmAddress: uint8ArrayToHex(record.evmAddress?.toBytes()),
  } as TxRecord;
}
