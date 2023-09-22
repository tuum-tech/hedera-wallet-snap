import BigNumber from 'bignumber.js';
import { createHederaClient } from '../../snap/account';
import { updateSnapState } from '../../snap/state';
import { PulseSnapParams } from '../../types/state';

/**
 * Get balance of an account.
 *
 * @param pulseSnapParams - Pulse snap params.
 * @returns Account Balance.
 */
export async function getAccountBalance(
  pulseSnapParams: PulseSnapParams,
): Promise<BigNumber> {
  const { state } = pulseSnapParams;

  const { metamaskAddress, hederaAccountId, network } = state.currentAccount;

  try {
    const hederaClient = await createHederaClient(
      state.accountState[metamaskAddress].keyStore.privateKey,
      hederaAccountId,
      network,
    );

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    state.accountState[metamaskAddress].accountInfo.balance!.hbars =
      await hederaClient.getAccountBalance();
    await updateSnapState(snap, state);
  } catch (error: any) {
    console.error(
      `Error while trying to get account balance: ${String(error)}`,
    );
    throw new Error(
      `Error while trying to get account balance: ${String(error)}`,
    );
  }

  return state.accountState[metamaskAddress].accountInfo.balance
    ?.hbars as BigNumber;
}
