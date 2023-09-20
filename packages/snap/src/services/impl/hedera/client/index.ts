import {
  AccountInfo,
  AccountInfoQuery,
  type AccountId,
  type Client,
  type PrivateKey,
  type PublicKey,
} from '@hashgraph/sdk';

import {
  AccountBalance,
  HederaAccountInfo,
  SimpleHederaClient,
} from '../../../hedera';
import { getAccountBalance } from './get-account-balance';

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

  async getAccountInfo(accountId: string): Promise<HederaAccountInfo> {
    // Create the account info query
    const query = new AccountInfoQuery().setAccountId(accountId);

    // Sign with client operator private key and submit the query to a Hedera network
    const accountInfo: AccountInfo = await query.execute(this._client);

    return accountInfo as unknown as HederaAccountInfo;
  }

  async getAccountBalance(): Promise<AccountBalance> {
    // NOTE: important, ensure that we pre-compute the health state of all nodes
    await this._client.pingAll();

    return getAccountBalance(this._client);
  }
}
