// See https://docs.kabuto.sh/reference#transaction

import type { AccountId, Timestamp } from '@hashgraph/sdk';

export type Transfer = {
  accountId: AccountId;
  amount: number;
  balance: number;
};

export type CryptoTransfer = {
  id: string;
  validStartAt: Timestamp;
  hash: string;
  operatorAccountId: AccountId;
  nodeAccountId: AccountId;
  type: string;
  typeCode: number;
  consensusAt: Timestamp;
  value: number;
  fee: number;
  maxFee: number;
  memo: string;
  status: string;
  statusCode: number;
  entity: AccountId;
  transfers: Transfer[];
  validDuration: number;
};
