import type { AccountId, PrivateKey, PublicKey } from '@hashgraph/sdk';
import { BigNumber } from 'bignumber.js';

import { CryptoTransfer } from '../domain/CryptoTransfer';
import { Wallet } from '../domain/wallet/abstract';

export type SimpleTransfer = {
  // HBAR or Token ID (as string)
  asset?: string;
  to?: AccountId;
  // amount must be in low denom
  amount?: BigNumber.Instance;
};

export type AccountBalance = {
  // balance here in hbars
  hbars: BigNumber;
  tokens: Map<string, TokenBalance>;
};

export type TokenBalance = {
  // balance has already had decimals applied
  balance: BigNumber;
  decimals: number;
};

export type HederaService = {
  // returns null if the account ID does not match the chosen key
  createClient(options: {
    network:
      | string
      | {
          [key: string]: string | AccountId;
        };
    wallet: Wallet;
    // index into the wallet, meaning depends on the wallet type
    // 0 always means the canonical key for the wallet
    keyIndex: number;
    // account ID we wish to associate with the wallet
    accountId: AccountId;
  }): Promise<SimpleHederaClient | null>;

  getNodeStakingInfo(
    network: 'mainnet' | 'testnet' | 'previewnet',
  ): Promise<NetworkNodeStakingInfo[]>;

  getMirrorAccountInfo(
    network: 'mainnet' | 'testnet' | 'previewnet',
    accountId: AccountId,
  ): Promise<MirrorAccountInfo>;
};

export type SimpleHederaClient = {
  // get the associated private key, if available
  getPrivateKey(): PrivateKey | null;

  // get the associated public key
  getPublicKey(): PublicKey;

  // get the associated account ID
  getAccountId(): AccountId;

  // returns the account balance in HBARs
  getAccountBalance(): Promise<AccountBalance>;

  getAccountRecords(): Promise<CryptoTransfer[] | undefined>;
};

export type NetworkNodeStakingInfo = {
  description: string;
  node_id: number;
  node_account_id: string;
  stake: BigNumber;
  min_stake: BigNumber;
  max_stake: BigNumber;
  stake_rewarded: BigNumber;
  stake_not_rewarded: BigNumber;
  reward_rate_start: BigNumber;
  // staking period uses strings representing seconds.nanos since the epoch
  staking_period: {
    from: string;
    to: string;
  };
};

export type MirrorAccountInfo = {
  account: string;
  staked_account_id?: string;
  staked_node_id?: number;
  stake_period_start?: number;
};
