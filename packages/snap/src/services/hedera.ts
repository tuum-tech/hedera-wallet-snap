import type {
  AccountId,
  CustomFee,
  Key,
  PrivateKey,
  PublicKey,
  Timestamp,
} from '@hashgraph/sdk';
import { Long } from '@hashgraph/sdk/lib/long';
import { BigNumber } from 'bignumber.js';

import { AccountInfoJson } from '@hashgraph/sdk/lib/account/AccountInfo';
import { Wallet } from '../domain/wallet/abstract';

export type SimpleTransfer = {
  // HBAR or Token ID (as string)
  asset: string;
  to: string;
  // amount must be in low denom
  amount: number;
};

export type Token = {
  token_id: string;
  balance: number;
};

export type AccountBalance = {
  // balance here in hbars
  hbars: number;
  timestamp: string;
  tokens: Map<string, TokenBalance>; // Map of TOKEN -> decimals
};

export type TokenBalance = {
  // balance has already had decimals applied
  balance: number;
  decimals: number;
};

export type TxRecordTransfer = {
  accountId: string;
  amount: string;
  isApproved: boolean;
};

export type TxReceiptExchangeRate = {
  hbars: number;
  cents: number;
  expirationTime: string;
  exchangeRateInCents: number;
};

export type TxReceipt = {
  status: string;
  accountId: string;
  fileId: string;
  contractId: string;
  topicId: string;
  tokenId: string;
  scheduleId: string;
  exchangeRate: TxReceiptExchangeRate;
  topicSequenceNumber: string;
  topicRunningHash: string;
  totalSupply: string;
  scheduledTransactionId: string;
  serials: object;
  duplicates: object;
  children: object;
};

export type TxRecord = {
  receipt: object;
  transactionHash: string;
  consensusTimestamp: string;
  transactionId: string;
  transactionMemo: string;
  transactionFee: string;
  transfers: TxRecordTransfer[];
  contractFunctionResult: object | null;
  tokenTransfers: object;
  tokenTransfersList: object;
  scheduleRef: string;
  assessedCustomFees: object;
  nftTransfers: object;
  automaticTokenAssociations: object;
  parentConsensusTimestamp: string;
  aliasKey: string;
  duplicates: object;
  children: object;
  ethereumHash: string;
  paidStakingRewards: TxRecordTransfer[];
  prngBytes: string;
  prngNumber: string;
  evmAddress: string;
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

  getNodeStakingInfo(): Promise<MirrorStakingInfo[]>;

  getMirrorAccountInfo(
    idOrAliasOrEvmAddress: string,
  ): Promise<MirrorAccountInfo>;

  getTokenById(tokenId: string): Promise<MirrorTokenInfo>;
};

export type SimpleHederaClient = {
  // get the associated private key, if available
  getPrivateKey(): PrivateKey | null;

  // get the associated public key
  getPublicKey(): PublicKey;

  // get the associated account ID
  getAccountId(): AccountId;

  getAccountInfo(accountId: string): Promise<AccountInfoJson>;

  // returns the account balance in HBARs
  getAccountBalance(): Promise<number>;

  transferCrypto(options: {
    currentBalance: AccountBalance;
    transfers: SimpleTransfer[];
    memo: string | null;
    maxFee: number | null; // tinybars
    onBeforeConfirm?: () => void;
  }): Promise<TxRecord>;
};

export type MirrorStakingInfo = {
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
    balance: number;
    timestamp: string;
    tokens: [];
  };
  created_timestamp: string;
  decline_reward: boolean;
  deleted: boolean;
  ethereum_nonce: Long;
  evm_address: string;
  expiry_timestamp: string;
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
  links: {
    next: string;
  };
};

export type MirrorTokenInfo = {
  admin_key: Key;
  auto_renew_account: string;
  auto_renew_period: number;
  created_timestamp: Timestamp;
  custom_fees: CustomFee;
  decimals: string;
  deleted: boolean;
  expiry_timestamp: string;
  fee_schedule_key: Key;
  freeze_default: boolean;
  initial_supply: string;
  max_supply: string;
  memo: string;
  modified_timestamp: Timestamp;
  name: string;
  pause_key: Key;
  pause_status: string;
  supply_key: Key;
  supply_type: string;
  symbol: string;
  token_id: string;
  total_supply: string;
  type: string;
  wipe_key: Key;
};
