import BigNumber from 'bignumber.js';
import { SimpleTransfer } from '../services/hedera';

export type TransferCryptoRequestParams = {
  transfers: SimpleTransfer[];
  memo?: string;
  maxFee?: BigNumber;
};
