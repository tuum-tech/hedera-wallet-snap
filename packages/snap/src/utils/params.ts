import _ from 'lodash';
import {
  GetAccountInfoRequestParams,
  TransferCryptoRequestParams,
} from '../types/params';

/**
 * Check Validation of getAccountInfo request.
 *
 * @param params - Request params.
 */
export function isValidGetAccountInfoRequest(
  params: unknown,
): asserts params is GetAccountInfoRequestParams {
  const parameter = params as GetAccountInfoRequestParams;

  if (
    'accountId' in parameter &&
    (parameter.accountId === null || typeof parameter.accountId !== 'string')
  ) {
    console.error(
      'Invalid getAccountInfo Params passed. "accountId" must be a string',
    );
    throw new Error(
      'Invalid getAccountInfo Params passed. "accountId" must be a string',
    );
  }
}

/**
 * Check Validation of transferCrypto request.
 *
 * @param params - Request params.
 */
export function isValidTransferCryptoParams(
  params: unknown,
): asserts params is TransferCryptoRequestParams {
  if (params === null || _.isEmpty(params) || !('transfers' in params)) {
    console.error(
      'Invalid transferCrypto Params passed. "transfers" must be passed as a parameter',
    );
    throw new Error(
      'Invalid transferCrypto Params passed. "transfers" must be passed as a parameter',
    );
  }

  const parameter = params as TransferCryptoRequestParams;

  if (parameter.transfers) {
    parameter.transfers.forEach((transfer: object) => {
      if (
        !('asset' in transfer) ||
        typeof transfer.asset !== 'string' ||
        _.isEmpty(transfer.asset)
      ) {
        console.error(
          `Invalid transferCrypto Params passed. "transfers[].asset" is not a string or is empty`,
        );
        throw new Error(
          `Invalid transferCrypto Params passed. "transfers[].asset" is not a string or is empty`,
        );
      }
      if (
        !('to' in transfer) ||
        typeof transfer.to !== 'string' ||
        _.isEmpty(transfer.to)
      ) {
        console.error(
          `Invalid transferCrypto Params passed. "transfers[].to" is not a string or is empty`,
        );
        throw new Error(
          `Invalid transferCrypto Params passed. "transfers[].to" is not a string or is empty`,
        );
      }
      if (!('amount' in transfer) || typeof transfer.amount !== 'number') {
        console.error(
          `Invalid transferCrypto Params passed. "transfers[].amount" is not a number`,
        );
        throw new Error(
          `Invalid transferCrypto Params passed. "transfers[].to" is not a number`,
        );
      }
    });
  }

  // Check if memo is valid
  if ('memo' in parameter && typeof parameter.memo !== 'string') {
    console.error(
      `Invalid transferCrypto Params passed. "memo" is not a string`,
    );
    throw new Error(
      `Invalid transferCrypto Params passed. "memo" is not a string`,
    );
  }

  // Check if maxFee is valid
  if ('maxFee' in parameter && typeof parameter.maxFee !== 'number') {
    console.error(
      `Invalid transferCrypto Params passed. "maxFee" is not a number`,
    );
    throw new Error(
      `Invalid transferCrypto Params passed. "maxFee" is not a number`,
    );
  }
}
