import { SimpleTransfer } from '../services/hedera';

export type TransferCryptoRequestParams = {
  transfers: SimpleTransfer[];
  memo?: string;
  maxFee?: number; // tinybars
};
