import type { AccountId, Client, PrivateKey, PublicKey } from '@hashgraph/sdk';

import { CryptoTransfer } from '../../../../domain/CryptoTransfer';
import { AccountBalance, SimpleHederaClient } from '../../../hedera';

import { getAccountBalance } from './get-account-balance';
import { getAccountRecords } from './get-account-records';

export class SimpleHederaClientImpl implements SimpleHederaClient {
  private _client: Client;

  private _privateKey: PrivateKey | null;

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

  async getAccountBalance(): Promise<AccountBalance> {
    // Workaround for extraneous signing in SDK,
    // use an operator - less client for balance queries
    const { Client } = await import('@hashgraph/sdk');
    const client = Client.forNetwork(this._client.network);

    // NOTE: important, ensure that we pre-compute the health state of all nodes
    await client.pingAll();

    return getAccountBalance(client);
  }

  getAccountRecords(): Promise<CryptoTransfer[] | undefined> {
    return getAccountRecords();
  }
}
