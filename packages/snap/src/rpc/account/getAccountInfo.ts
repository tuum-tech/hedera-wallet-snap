import { updateSnapState } from '../../snap/state';
import { AccountInfo } from '../../types/account';
import { PulseSnapParams } from '../../types/state';

/**
 * Get account info such as address, did, public key, etc.
 *
 * @param pulseSnapParams - Pulse snap params.
 * @returns Account Info.
 */
export async function getAccountInfo(
  pulseSnapParams: PulseSnapParams,
): Promise<AccountInfo> {
  const { state, hederaClient } = pulseSnapParams;

  const response = await hederaClient.getAccountInfo(
    state.currentAccount.hederaAccountId,
  );
  // Let's massage the info we want rather than spitting out everything
  state.accountState[
    state.currentAccount.metamaskAddress
  ].accountInfo.extraData = JSON.parse(JSON.stringify(response));

  await updateSnapState(snap, state);

  return state.accountState[state.currentAccount.metamaskAddress].accountInfo;
}
