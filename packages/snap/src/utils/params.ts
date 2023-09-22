import { TransferCryptoRequestParams } from '../types/params';

/**
 * Check Validation of Resolve DID request.
 *
 * @param params - Request params.
 */
export function isValidTransferCryptoParams(
  params: unknown,
): asserts params is TransferCryptoRequestParams {
  const parameter = params as TransferCryptoRequestParams;
  console.log('parameter: ', parameter);
  // TODO
}
