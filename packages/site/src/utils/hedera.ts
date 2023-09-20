export const isIn = <T>(values: readonly T[], value: any): value is T => {
  return values.includes(value);
};

const hederaChainIDs = new Map([
  ['0x127', 'mainnet'],
  ['0x128', 'testnet'],
  ['0x12a', 'localnet'],
]);

export const getHederaNetwork = (chainId: string): string => {
  const network = hederaChainIDs.get(chainId);
  return network || 'mainnet';
};

export const validHederaChainID = (x: string) =>
  isIn(Array.from(hederaChainIDs.keys()), x);

export const getNetwork = (chainId: string): string => {
  let network = 'mainnet';
  if (chainId) {
    if (validHederaChainID(chainId)) {
      network = getHederaNetwork(chainId);
    }
  }
  return network;
};
