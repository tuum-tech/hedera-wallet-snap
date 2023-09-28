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
): Promise<number> {
  const { state } = pulseSnapParams;

  const { hederaAccountId, hederaEvmAddress, network } = state.currentAccount;

  try {
    const hederaClient = await createHederaClient(
      state.accountState[hederaEvmAddress][network].keyStore.curve,
      state.accountState[hederaEvmAddress][network].keyStore.privateKey,
      hederaAccountId,
      network,
    );

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    state.accountState[hederaEvmAddress][network].accountInfo.balance!.hbars =
      await hederaClient.getAccountBalance();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    state.accountState[hederaEvmAddress][
      network
    ].accountInfo.balance!.timestamp = new Date().toISOString();
    await updateSnapState(state);
  } catch (error: any) {
    console.error(
      `Error while trying to get account balance: ${String(error)}`,
    );
    throw new Error(
      `Error while trying to get account balance: ${String(error)}`,
    );
  }

  return state.accountState[hederaEvmAddress][network].accountInfo.balance
    ?.hbars as number;
}
