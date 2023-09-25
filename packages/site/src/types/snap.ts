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
  hbars: number;
  tokens: Map<string, TokenBalance>; // Map of TOKEN -> decimals
};

export type TokenBalance = {
  // balance has already had decimals applied
  balance: number;
  decimals: number;
};

export type SimpleTransfer = {
  // HBAR or Token ID (as string)
  asset?: string;
  to?: string;
  // amount must be in low denom
  amount?: number;
};

export type TransferCryptoRequestParams = {
  transfers: SimpleTransfer[];
  memo?: string;
  maxFee?: number; // tinybars
};

export type ExternalAccountParams = {
  externalAccount: {
    accountId: string;
  };
};
