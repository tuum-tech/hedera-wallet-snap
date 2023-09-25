import _ from 'lodash';
import { HederaAccountInfo } from 'src/services/hedera';
import { createHederaClient } from '../../snap/account';
import { updateSnapState } from '../../snap/state';
import { PulseSnapParams } from '../../types/state';

/**
 * Get account info such as address, did, public key, etc.
 *
 * @param pulseSnapParams - Pulse snap params.
 * @param accountId - Hedera Account Id.
 * @returns Account Info.
 */
export async function getAccountInfo(
  pulseSnapParams: PulseSnapParams,
  accountId?: string,
): Promise<any> {
  const { state } = pulseSnapParams;

  const { metamaskAddress, hederaAccountId, network } = state.currentAccount;

  let accountInfo = {};

  try {
    const hederaClient = await createHederaClient(
      state.accountState[metamaskAddress].keyStore.privateKey,
      hederaAccountId,
      network,
    );

    let response: HederaAccountInfo;
    if (accountId && !_.isEmpty(accountId)) {
      response = await hederaClient.getAccountInfo(accountId);
    } else {
      response = await hederaClient.getAccountInfo(hederaAccountId);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      state.accountState[metamaskAddress].accountInfo.balance!.hbars = Number(
        response.balance.toString().replace(' ℏ', ''),
      );

      // Let's massage the info we want rather than spitting out everything
      state.accountState[metamaskAddress].accountInfo.extraData = JSON.parse(
        JSON.stringify(response),
      );
      await updateSnapState(snap, state);
    }
    accountInfo = JSON.parse(JSON.stringify(response));
  } catch (error: any) {
    console.error(`Error while trying to get account info: ${String(error)}`);
    throw new Error(`Error while trying to get account info: ${String(error)}`);
  }

  return accountInfo;
}
