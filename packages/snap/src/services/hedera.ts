import type {
  AccountId,
  Hbar,
  HbarAllowance,
  Key,
  LedgerId,
  LiveHash,
  PrivateKey,
  PublicKey,
  Timestamp,
  TokenAllowance,
  TokenNftAllowance,
} from '@hashgraph/sdk';
import TokenRelationshipMap from '@hashgraph/sdk/lib/account/TokenRelationshipMap';
import Duration from '@hashgraph/sdk/lib/Duration';
import { Long } from '@hashgraph/sdk/lib/long';
import StakingInfo from '@hashgraph/sdk/lib/StakingInfo';
import { BigNumber } from 'bignumber.js';

import { Wallet } from '../domain/wallet/abstract';

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
    wallet: Wallet;
    // index into the wallet, meaning depends on the wallet type
    // 0 always means the canonical key for the wallet
    keyIndex: number;
    // account ID we wish to associate with the wallet
    accountId: AccountId;
  }): Promise<SimpleHederaClient | null>;

  getNodeStakingInfo(): Promise<NetworkNodeStakingInfo[]>;

  getMirrorAccountInfo(
    idOrAliasOrEvmAddress: string,
  ): Promise<MirrorAccountInfo>;
};

export type SimpleHederaClient = {
  // get the associated private key, if available
  getPrivateKey(): PrivateKey | null;

  // get the associated public key
  getPublicKey(): PublicKey;

  // get the associated account ID
  getAccountId(): AccountId;

  getAccountInfo(accountId: string): Promise<HederaAccountInfo>;

  // returns the account balance in HBARs
  getAccountBalance(): Promise<AccountBalance>;
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
  alias: string;
  auto_renew_period: Long;
  balance: {
    balance: Long;
    timestamp: Timestamp;
    tokens: [];
  };
  created_timestamp: Timestamp;
  decline_reward: boolean;
  deleted: boolean;
  ethereum_nonce: Long;
  evm_address: string;
  expiry_timestamp: Timestamp;
  key: {
    _type: string;
    key: string;
  };
  max_automatic_token_associations: Long;
  memo: string;
  pending_reward: Long;
  receiver_sig_required: boolean;
  staked_account_id?: string;
  staked_node_id?: number;
  stake_period_start?: number;
  transactions: [];
};

export type HederaAccountInfo = {
  accountId: AccountId;
  contractAccountId?: string;
  isDeleted: boolean;
  proxyAccountId?: object;
  proxyReceived: Hbar;
  key: Key;
  balance: Hbar;
  sendRecordThreshold: Hbar;
  receiveRecordThreshold: Hbar;
  isReceiverSignatureRequired: boolean;
  expirationTime: Timestamp;
  autoRenewPeriod: Duration;
  liveHashes: LiveHash[];
  tokenRelationships: TokenRelationshipMap;
  accountMemo: string;
  ownedNfts: Long;
  maxAutomaticTokenAssociations: Long;
  aliasKey: PublicKey;
  ledgerId: LedgerId;
  hbarAllowances: HbarAllowance[];
  tokenAllowances: TokenAllowance[];
  nftAllowances: TokenNftAllowance[];
  ethereumNonce?: Long;
  stakingInfo?: StakingInfo;
};
