import { createHederaClient } from '../../snap/account';
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
  const { state } = pulseSnapParams;

  const { metamaskAddress, hederaAccountId, network } = state.currentAccount;

  try {
    const hederaClient = await createHederaClient(
      state.accountState[metamaskAddress].keyStore.privateKey,
      hederaAccountId,
      network,
    );

    const response = await hederaClient.getAccountInfo(hederaAccountId);

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    state.accountState[metamaskAddress].accountInfo.balance!.hbars = Number(
      response.balance.toString().replace(' ℏ', ''),
    );

    // Let's massage the info we want rather than spitting out everything
    state.accountState[metamaskAddress].accountInfo.extraData = JSON.parse(
      JSON.stringify(response),
    );
    await updateSnapState(snap, state);
    // TODO: still need to update  state.accountState[metamaskAddress].accountInfo.balance
  } catch (error: any) {
    console.error(`Error while trying to get account info: ${String(error)}`);
    throw new Error(`Error while trying to get account info: ${String(error)}`);
  }

  return state.accountState[metamaskAddress].accountInfo;
}
