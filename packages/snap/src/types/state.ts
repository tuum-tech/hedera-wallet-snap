import { SnapsGlobalObject } from '@metamask/snaps-types';
import { Panel } from '@metamask/snaps-ui';

import { Wallet } from '../domain/wallet/abstract';
import { SimpleHederaClient } from '../services/hedera';

export type Account = {
  metamaskAddress: string; // This is not being used currently
  hederaAccountId: string;
  hederaEvmAddress: string;
  network: string;
};

export type PulseSnapState = {
  currentAccount: Account;

  /**
   * Account specific storage
   * mapping(address -> state)
   */
  accountState: Record<string, PulseAccountState>;

  /**
   * Configuration for PulseSnap
   */
  snapConfig: PulseSnapConfig;
};

export type PulseSnapConfig = {
  snap: {
    acceptedTerms: boolean;
  };
  dApp: {
    disablePopups: boolean;
    friendlyDapps: string[];
  };
};

/**
 * Pulse Snap State for a MetaMask address
 */
export type PulseAccountState = {
  wallet: Wallet;
  accountIds: string[];

  index?: number;
};

export type PulseSnapParams = {
  origin: string;
  snap: SnapsGlobalObject;
  state: PulseSnapState;
  hederaClient: SimpleHederaClient;
};

export type SnapDialogParams = {
  type: 'alert' | 'confirmation' | 'prompt';
  content: Panel;
  placeholder?: string;
};

export type HederaAccountParams = {
  network: string;
};
