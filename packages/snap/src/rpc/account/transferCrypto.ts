import {
  AccountBalance,
  SimpleTransfer,
  TxRecord,
} from '../../services/hedera';
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
export async function transferCrypto(
  pulseSnapParams: PulseSnapParams,
  transferCryptoParams: TransferCryptoRequestParams,
): Promise<TxRecord> {
  const { state } = pulseSnapParams;

  const {
    transfers = [] as SimpleTransfer[],
    memo = null,
    maxFee = null,
  } = transferCryptoParams;

  const { metamaskAddress, hederaAccountId, network } = state.currentAccount;

  let record = {} as TxRecord;
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

    record = await hederaClient.transferCrypto({
      currentBalance,
      transfers,
      memo,
      maxFee,
    });
  } catch (error: any) {
    console.error(`Error while trying to transfer crypto: ${String(error)}`);
    throw new Error(`Error while trying to transfer crypto: ${String(error)}`);
  }

  return record;
}
