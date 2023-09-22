import { Panel } from '@metamask/snaps-ui';

import { Account, AccountInfo } from './account';

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

export type KeyStore = {
  privateKey: string;
  publicKey: string;
  address: string;
};

/**
 * Pulse Snap State for a MetaMask address
 */
export type PulseAccountState = {
  keyStore: KeyStore;
  accountId: string;
  accountInfo: AccountInfo;
};

export type PulseSnapParams = {
  origin: string;
  state: PulseSnapState;
};

export type SnapDialogParams = {
  type: 'alert' | 'confirmation' | 'prompt';
  content: Panel;
  placeholder?: string;
};

export type HederaAccountParams = {
  network: string;
};
