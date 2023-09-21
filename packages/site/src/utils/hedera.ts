export const isIn = <T>(values: readonly T[], value: any): value is T => {
  return values.includes(value);
};

export const hederaNetworks = new Map([
  ['mainnet', 'mainnet'],
  ['testnet', 'testnet'],
  ['previewnet', 'previewnet'],
]);

export const validHederaChainID = (x: string) =>
  isIn(Array.from(hederaNetworks.values()), x);
