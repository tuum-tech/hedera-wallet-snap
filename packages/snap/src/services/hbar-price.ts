import { BigNumber } from 'bignumber.js';

export type HbarPriceService = {
  getHbarPriceInUsd(): Promise<BigNumber>;
};
