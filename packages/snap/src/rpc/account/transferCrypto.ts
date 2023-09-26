import { divider, heading, panel, text } from '@metamask/snaps-ui';
import _ from 'lodash';
import {
  AccountBalance,
  SimpleTransfer,
  TxRecord,
} from '../../services/hedera';
import { createHederaClient } from '../../snap/account';
import { snapDialog } from '../../snap/dialog';
import { TransferCryptoRequestParams } from '../../types/params';
import { PulseSnapParams, SnapDialogParams } from '../../types/state';

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
  const { origin, state } = pulseSnapParams;

  const {
    transfers = [] as SimpleTransfer[],
    memo = null,
    maxFee = null,
  } = transferCryptoParams;

  const { metamaskAddress, hederaAccountId, network } = state.currentAccount;

  const panelToShow = [
    text(`Origin: ${origin}`),
    divider(),
    heading('Transfer Crypto'),
    text('Are you sure you want to execute the following transaction(s)?'),
    divider(),
    text(`Memo: ${memo === null || _.isEmpty(memo) ? 'N/A' : memo}`),
    text(`Max Transaction Fee: ${maxFee ?? 1} Hbar`),
  ];

  transfers.forEach((transfer, index) => {
    panelToShow.push(divider());

    const txNumber = (index + 1).toString();
    panelToShow.push(text(`Transaction #${txNumber}`));
    panelToShow.push(divider());

    panelToShow.push(text(`Asset: ${transfer.asset}`));
    panelToShow.push(text(`To: ${transfer.to}`));
    panelToShow.push(text(`Amount: ${transfer.amount} Hbar`));
  });

  const dialogParams: SnapDialogParams = {
    type: 'confirmation',
    content: panel(panelToShow),
  };

  if (await snapDialog(dialogParams)) {
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

      return await hederaClient.transferCrypto({
        currentBalance,
        transfers,
        memo,
        maxFee,
      });
    } catch (error: any) {
      console.error(`Error while trying to transfer crypto: ${String(error)}`);
      throw new Error(
        `Error while trying to transfer crypto: ${String(error)}`,
      );
    }
  }
  throw new Error('User rejected the transaction');
}
