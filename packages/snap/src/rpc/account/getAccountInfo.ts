import { HederaAccountInfo } from '../../services/hedera';
import { PulseSnapParams } from '../../types/state';

/**
 * Get account info such as address, did, public key, etc.
 *
 * @param pulseSnapParams - Pulse snap params.
 * @returns Public Account Info.
 */
export async function getAccountInfo(
  pulseSnapParams: PulseSnapParams,
): Promise<HederaAccountInfo> {
  const { state, hederaClient } = pulseSnapParams;

  return hederaClient.getAccountInfo(state.currentAccount.hederaAccountId);
}
