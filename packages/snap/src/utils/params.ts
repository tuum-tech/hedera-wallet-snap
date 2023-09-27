import _ from 'lodash';
import { ExternalAccount } from '../types/account';
import {
  GetAccountInfoRequestParams,
  TransferCryptoRequestParams,
} from '../types/params';

/**
 * Check whether the the account was imported using private key(external account).
 *
 * @param params - Request params.
 * @returns Whether to treat it as an external account that was imported using private key.
 */
export function isExternalAccountFlagSet(params: unknown): boolean {
  if (
    params !== null &&
    typeof params === 'object' &&
    'externalAccount' in params &&
    params.externalAccount !== null &&
    typeof params.externalAccount === 'object'
  ) {
    const parameter = params as ExternalAccount;

    if ('accountIdOrEvmAddress' in parameter.externalAccount) {
      if (
        parameter.externalAccount.accountIdOrEvmAddress !== null &&
        typeof parameter.externalAccount.accountIdOrEvmAddress === 'string'
      ) {
        if (_.isEmpty(parameter.externalAccount.accountIdOrEvmAddress)) {
          console.error(
            'Invalid externalAccount Params passed. "accountIdOrEvmAddress" must not be empty',
          );
          throw new Error(
            'Invalid externalAccount Params passed. "accountIdOrEvmAddress" must not be empty',
          );
        }
        return true;
      }
    }
  }
  return false;
}

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
