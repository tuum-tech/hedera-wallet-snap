import {
  AccountId,
  Client,
  Hbar,
  PrivateKey,
  Status,
  StatusError,
  TransferTransaction,
} from '@hashgraph/sdk';
import BigNumber from 'bignumber.js';
import _ from 'lodash';

import { Wallet } from '../../../domain/wallet/abstract';
import { PrivateKeySoftwareWallet } from '../../../domain/wallet/software-private-key';
import { FetchResponse, fetchDataFromUrl } from '../../../utils/fetch';
import {
  HederaService,
  MirrorAccountInfo,
  MirrorStakingInfo,
  MirrorTokenInfo,
  SimpleHederaClient,
} from '../../hedera';
import { SimpleHederaClientImpl } from './client';

export class HederaServiceImpl implements HederaService {
  // eslint-disable-next-line no-restricted-syntax
  private readonly network: string;

  // eslint-disable-next-line no-restricted-syntax
  private readonly urlBase: string;

  constructor(network: string) {
    this.network = network;
    // eslint-disable-next-line default-case
    switch (network) {
      case 'testnet':
        this.urlBase = 'testnet';
        break;
      case 'previewnet':
        this.urlBase = 'previewnet';
        break;
      default:
        this.urlBase = 'mainnet-public';
    }
  }

  async createClient(options: {
    wallet: Wallet;
    keyIndex: number;
    accountId: AccountId;
  }): Promise<SimpleHederaClient | null> {
    let client;

    if (this.network === 'testnet') {
      // client = Client.forTestnet();
      client = Client.forNetwork({
        'https://testnet-node00-00-grpc.hedera.com:443': new AccountId(3),
      });
    } else if (this.network === 'previewnet') {
      client = Client.forPreviewnet();
    } else {
      client = Client.forMainnet();
    }

    // NOTE: important, ensure that we pre-compute the health state of all nodes
    await client.pingAll();

    const transactionSigner = await options.wallet.getTransactionSigner(
      options.keyIndex,
    );

    const privateKey = await options.wallet.getPrivateKey(options.keyIndex);
    const publicKey = await options.wallet.getPublicKey(options.keyIndex);

    if (publicKey === null) {
      return null;
    }

    // TODO: Fix
    client.setOperatorWith(
      options.accountId,
      publicKey ?? '',
      transactionSigner,
    );

    if (!(await testClientOperatorMatch(client))) {
      return null;
    }

    return new SimpleHederaClientImpl(client, privateKey);
  }

  async getNodeStakingInfo(): Promise<MirrorStakingInfo[]> {
    const result: MirrorStakingInfo[] = [];

    const url = `https://${this.urlBase}.mirrornode.hedera.com/api/v1/network/nodes?order=asc&limit=25`;
    const response: FetchResponse = await fetchDataFromUrl(url);
    if (response.success) {
      for (const node of response.data.nodes) {
        result.push({
          description: node.description,
          node_id: node.node_id,
          node_account_id: node.node_account_id,
          min_stake: new BigNumber(node.min_stake),
          max_stake: new BigNumber(node.max_stake),
          stake: new BigNumber(node.stake),
          stake_rewarded: new BigNumber(node.stake_rewarded),
          stake_not_rewarded: new BigNumber(node.stake_not_rewarded),
          reward_rate_start: new BigNumber(node.reward_rate_start),
          staking_period: node.staking_period,
        });
      }

      if (response.data.links.next) {
        const secondUrl = `https://${this.urlBase}.mirrornode.hedera.com${
          response.data.links.next as string
        }`;
        const secondResponse: FetchResponse = await fetchDataFromUrl(secondUrl);
        if (secondResponse.success) {
          for (const node of secondResponse.data.nodes) {
            result.push({
              description: node.description,
              node_id: node.node_id,
              node_account_id: node.node_account_id,
              min_stake: new BigNumber(node.min_stake),
              max_stake: new BigNumber(node.max_stake),
              stake: new BigNumber(node.stake),
              stake_rewarded: new BigNumber(node.stake_rewarded),
              stake_not_rewarded: new BigNumber(node.stake_not_rewarded),
              reward_rate_start: new BigNumber(node.reward_rate_start),
              staking_period: node.staking_period,
            });
          }
        }
      }
    }

    return result;
  }

  async getMirrorAccountInfo(
    idOrAliasOrEvmAddress: string,
  ): Promise<MirrorAccountInfo> {
    let result = {} as MirrorAccountInfo;
    const url = `https://${this.urlBase}.mirrornode.hedera.com/api/v1/accounts/${idOrAliasOrEvmAddress}`;
    const response: FetchResponse = await fetchDataFromUrl(url);
    if (response.success) {
      result = response.data;
    }
    return result;
  }

  async getTokenById(tokenId: string): Promise<MirrorTokenInfo> {
    let result = {} as MirrorTokenInfo;
    const url = `https://${this.urlBase}.mirrornode.hedera.com/api/v1/tokens/${tokenId}`;
    const response: FetchResponse = await fetchDataFromUrl(url);
    if (response.success) {
      result = response.data;
    }
    return result;
  }
}

/**
 * Does the operator key belong to the operator account.
 *
 * @param client - Hedera Client.
 */
async function testClientOperatorMatch(client: Client) {
  const tx = new TransferTransaction()
    /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
    .addHbarTransfer(client.operatorAccountId!, Hbar.fromTinybars(0))
    .setMaxTransactionFee(Hbar.fromTinybars(1));

  try {
    await tx.execute(client);
  } catch (error: any) {
    if (error instanceof StatusError) {
      if (
        error.status === Status.InsufficientTxFee ||
        error.status === Status.InsufficientPayerBalance
      ) {
        // If the transaction fails with Insufficient Tx Fee, this means
        // that the account ID verification succeeded before this point
        // Same for Insufficient Payer Balance

        return true;
      }

      return false;
    }

    throw error;
  }

  // under *no* cirumstances should this transaction succeed
  throw new Error(
    'unexpected success of intentionally-erroneous transaction to confirm account ID',
  );
}

/**
 * To HederaAccountInfo.
 *
 * @param _privateKey - Private Key.
 * @param _accountId - Account Id.
 * @param _network - Network.
 */
export async function getHederaClient(
  _privateKey: string,
  _accountId: string,
  _network: string,
): Promise<SimpleHederaClient | null> {
  const accountId = AccountId.fromString(_accountId);
  const privateKey = PrivateKey.fromStringECDSA(_privateKey);
  const wallet: Wallet = new PrivateKeySoftwareWallet(privateKey);
  const hederaService = new HederaServiceImpl(_network);

  const client = await hederaService.createClient({
    wallet,
    keyIndex: 0,
    accountId,
  });

  if (client === null || _.isEmpty(client)) {
    console.error('Invalid private key or account Id of the operator');
    return null;
  }

  return client;
}
