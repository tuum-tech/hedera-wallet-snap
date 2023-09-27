import { AccountId } from '@hashgraph/sdk';
import { AccountInfoJson } from '@hashgraph/sdk/lib/account/AccountInfo';
import _ from 'lodash';
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
): Promise<AccountInfoJson> {
  const { state } = pulseSnapParams;

  const { metamaskAddress, hederaAccountId, network } = state.currentAccount;

  let accountInfo = {} as AccountInfoJson;

  try {
    const hederaClient = await createHederaClient(
      state.accountState[metamaskAddress].keyStore.curve,
      state.accountState[metamaskAddress].keyStore.privateKey,
      hederaAccountId,
      network,
    );

    if (accountId && !_.isEmpty(accountId)) {
      if (!AccountId.fromString(accountId)) {
        console.error(
          `Invalid Hedera Account Id '${accountId}' is not a valid account Id`,
        );
        throw new Error(
          `Invalid Hedera Account Id '${accountId}' is not a valid account Id`,
        );
      }
      accountInfo = await hederaClient.getAccountInfo(accountId);
    } else {
      accountInfo = await hederaClient.getAccountInfo(hederaAccountId);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      state.accountState[metamaskAddress].accountInfo.balance!.hbars = Number(
        accountInfo.balance.toString().replace(' ℏ', ''),
      );

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      state.accountState[metamaskAddress].accountInfo.balance!.timestamp =
        new Date().toISOString();

      state.accountState[metamaskAddress].accountInfo.extraData = accountInfo;
      await updateSnapState(state);
    }
  } catch (error: any) {
    console.error(`Error while trying to get account info: ${String(error)}`);
    throw new Error(`Error while trying to get account info: ${String(error)}`);
  }

  return accountInfo;
}
