import { TransactionReceipt } from '@hashgraph/sdk';
import { AccountBalance } from '../../services/hedera';
import { createHederaClient } from '../../snap/account';
import { TransferCryptoRequestParams } from '../../types/params';
import { PulseSnapParams } from '../../types/state';

/**
 * Transfer crypto(hbar or other tokens).
 *
 * @param pulseSnapParams - Pulse snap params.
 * @param transferCryptoParams - Parameters for transferring crypto.
 * @returns Account Info.
 */
export async function sendHbarToAccountId(
  pulseSnapParams: PulseSnapParams,
  transferCryptoParams: TransferCryptoRequestParams,
): Promise<TransactionReceipt> {
  const { state } = pulseSnapParams;

  const { transfers, memo = null, maxFee = null } = transferCryptoParams;

  const { metamaskAddress, hederaAccountId, network } = state.currentAccount;

  let receipt = {} as TransactionReceipt;
  try {
    let currentBalance =
      state.accountState[metamaskAddress].accountInfo.balance;
    if (!currentBalance) {
      currentBalance = {} as AccountBalance;
    }

    const hederaClient = await createHederaClient(
      state.accountState[metamaskAddress].keyStore.privateKey,
      hederaAccountId,
      network,
    );

    receipt = await hederaClient.transferCrypto({
      currentBalance,
      transfers,
      memo,
      maxFee,
    });
  } catch (error: any) {
    console.error(`Error while trying to transfer crypto: ${String(error)}`);
    throw new Error(`Error while trying to transfer crypto: ${String(error)}`);
  }

  return receipt;
}
