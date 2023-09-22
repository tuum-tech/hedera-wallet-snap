import { Timestamp } from '@hashgraph/sdk';
import { AccountBalance } from '../services/hedera';

export type Account = {
  metamaskAddress: string; // This is not being used currently
  hederaAccountId: string;
  hederaEvmAddress: string;
  balance: AccountBalance;
  network: string;
};

export type AccountInfo = {
  alias?: string;
  createdTime?: Timestamp;
  memo?: string;
  balance?: AccountBalance;
  extraData?: object;
};
