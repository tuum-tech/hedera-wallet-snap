import { Panel } from '@metamask/snaps-ui';

import { Account, AccountInfo } from './account';

export type PulseSnapState = {
  currentAccount: Account;

  /**
   * Account specific storage
   * mapping(evm address -> mapping(network -> state))
   */
  accountState: Record<string, Record<string, PulseAccountState>>;

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
  curve: 'ECDSA_SECP256K1' | 'ED25519';
  privateKey: string;
  publicKey: string;
  address: string;
  hederaAccountId: string;
};

/**
 * Pulse Snap State for a MetaMask address
 */
export type PulseAccountState = {
  keyStore: KeyStore;
  mirrorNodeUrl: string;
  accountInfo: AccountInfo;
};

export type PulseSnapParams = {
  origin: string;
  state: PulseSnapState;
  mirrorNodeUrl: string;
};

export type SnapDialogParams = {
  type: 'alert' | 'confirmation' | 'prompt';
  content: Panel;
  placeholder?: string;
};
