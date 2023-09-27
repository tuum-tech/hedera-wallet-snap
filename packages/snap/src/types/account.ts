import { AccountInfoJson } from '@hashgraph/sdk/lib/account/AccountInfo';
import { AccountBalance } from '../services/hedera';

export type ExternalAccount = {
  externalAccount: {
    accountIdOrEvmAddress: string;
    curve?: 'ECDSA_SECP256K1' | 'ED25519';
  };
};

export type Account = {
  metamaskAddress: string; // This is not being used currently
  hederaAccountId: string;
  hederaEvmAddress: string;
  balance: AccountBalance;
  network: string;
};

export type AccountInfo = {
  alias?: string;
  createdTime?: string;
  memo?: string;
  balance?: AccountBalance;
  extraData?: AccountInfoJson;
};

export type NetworkParams = {
  network: string;
};
