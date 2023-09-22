import BigNumber from 'bignumber.js';

export type GetSnapsResponse = Record<string, Snap>;

export type Snap = {
  permissionName: string;
  id: string;
  version: string;
  initialPermissions: Record<string, unknown>;
};

export type Account = {
  metamaskAddress: string;
  hederaAccountId: string;
  hederaEvmAddress: string;
  balance: AccountBalance;
  network: string;
};

export type AccountBalance = {
  // balance here in hbars
  hbars: BigNumber;
  tokens: Map<string, BigNumber>;
};

export type ExternalAccountParams = {
  externalAccount: {
    accountId: string;
  };
};
