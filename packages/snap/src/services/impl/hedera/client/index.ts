import {
  type AccountId,
  type Client,
  type PrivateKey,
  type PublicKey,
} from '@hashgraph/sdk';

import { AccountInfoJson } from '@hashgraph/sdk/lib/account/AccountInfo';
import {
  AccountBalance,
  SimpleHederaClient,
  SimpleTransfer,
  TxRecord,
} from '../../../hedera';
import { getAccountBalance } from './getAccountBalance';
import { getAccountInfo } from './getAccountInfo';
import { transferCrypto } from './transferCrypto';

export class SimpleHederaClientImpl implements SimpleHederaClient {
  // eslint-disable-next-line no-restricted-syntax
  private readonly _client: Client;

  // eslint-disable-next-line no-restricted-syntax
  private readonly _privateKey: PrivateKey | null;

  constructor(client: Client, privateKey: PrivateKey | null) {
    this._client = client;
    this._privateKey = privateKey;
  }

  getPrivateKey(): PrivateKey | null {
    return this._privateKey;
  }

  getPublicKey(): PublicKey {
    /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
    return this._client.operatorPublicKey!;
  }

  getAccountId(): AccountId {
    /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
    return this._client.operatorAccountId!;
  }

  async getAccountInfo(accountId: string): Promise<AccountInfoJson> {
    return getAccountInfo(this._client, accountId);
  }

  async getAccountBalance(): Promise<number> {
    return getAccountBalance(this._client);
  }

  transferCrypto(options: {
    currentBalance: AccountBalance;
    transfers: SimpleTransfer[];
    memo: string | null;
    maxFee: number | null;
    onBeforeConfirm?: () => void;
  }): Promise<TxRecord> {
    return transferCrypto(this._client, options);
  }
}
