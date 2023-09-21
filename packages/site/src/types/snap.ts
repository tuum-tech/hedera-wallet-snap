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
  network: string;
};

export type ExternalAccountParams = {
  externalAccount: {
    accountId: string;
  };
};
