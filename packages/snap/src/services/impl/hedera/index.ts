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
import { fetchDataFromUrl } from '../../../utils/fetch';
import {
  HederaService,
  MirrorAccountInfo,
  NetworkNodeStakingInfo,
  SimpleHederaClient,
} from '../../hedera';
import { SimpleHederaClientImpl } from './client';

export class HederaServiceImpl implements HederaService {
  // eslint-disable-next-line no-restricted-syntax
  private readonly network: string;

  constructor(network: string) {
    this.network = network;
  }

  async createClient(options: {
    wallet: Wallet;
    keyIndex: number;
    accountId: AccountId;
  }): Promise<SimpleHederaClient | null> {
    const client = Client.forNetwork(this.network as any);

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

  async getNodeStakingInfo(
    network: 'mainnet' | 'testnet' | 'previewnet',
  ): Promise<NetworkNodeStakingInfo[]> {
    let urlBase = '';
    // eslint-disable-next-line default-case
    switch (network) {
      case 'mainnet':
        urlBase = 'mainnet-public';
        break;
      case 'testnet':
        urlBase = 'testnet';
        break;
      case 'previewnet':
        urlBase = 'previewnet';
        break;
    }

    const response = await fetchDataFromUrl(
      `https://${urlBase}.mirrornode.hedera.com/api/v1/network/nodes?order=asc&limit=25`,
    );
    const result: NetworkNodeStakingInfo[] = [];
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
      const secondResponse = await fetchDataFromUrl(
        `https://${urlBase}.mirrornode.hedera.com${
          response.data.links.next as string
        }`,
      );
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

    return result;
  }

  async getMirrorAccountInfo(
    network: 'mainnet' | 'testnet' | 'previewnet',
    accountId: AccountId,
  ): Promise<MirrorAccountInfo> {
    let urlBase = '';
    // eslint-disable-next-line default-case
    switch (network) {
      case 'mainnet':
        urlBase = 'mainnet-public';
        break;
      case 'testnet':
        urlBase = 'testnet';
        break;
      case 'previewnet':
        urlBase = 'previewnet';
        break;
    }

    const response = await fetchDataFromUrl(
      `https://${urlBase}.mirrornode.hedera.com/api/v1/accounts/${accountId.toString()}`,
    );
    return response.data;
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
export async function isValidHederaAccountInfo(
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
