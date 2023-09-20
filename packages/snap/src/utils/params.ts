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
    const { accountIds } = state.accountState[address];
    for (const hederaAccountId of Object.keys(accountIds)) {
      if (evmAddress && evmAddress === address) {
        result = hederaAccountId;
      }
    }
  }
  return result;
}
