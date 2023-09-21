import {
  Hbar,
  HbarAllowance,
  Key,
  LedgerId,
  LiveHash,
  Timestamp,
  TokenAllowance,
  TokenNftAllowance,
} from '@hashgraph/sdk';
import StakingInfo from '@hashgraph/sdk/lib/StakingInfo';
import TokenRelationshipMap from '@hashgraph/sdk/lib/account/TokenRelationshipMap';
import { Long } from '@hashgraph/sdk/lib/long';

export type Account = {
  metamaskAddress: string; // This is not being used currently
  hederaAccountId: string;
  hederaEvmAddress: string;
  network: string;
};

export type AccountInfo = {
  alias?: string;
  createdTime?: Timestamp;
  evmAddress?: string;
  memo?: string;
  extraData?: object;
};
