import { PulseSnapState } from '../types/state';

/**
 * Check if Hedera account was imported.
 *
 * @param state - PulseSnapState.
 * @param evmAddress - Ethereum address.
 * @returns Result.
 */
export async function getHederaAccountIfExists(
  state: PulseSnapState,
  evmAddress: string,
): Promise<string> {
  let result = '';
  for (const address of Object.keys(state.accountState)) {
    const { accountId, accountInfo } = state.accountState[address];
    if (accountInfo.evmAddress === evmAddress) {
      result = accountId;
    }
  }
  return result;
}
