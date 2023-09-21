import { SnapsGlobalObject } from '@metamask/snaps-types';

import { divider, heading, text } from '@metamask/snaps-ui';
import { MirrorAccountInfo, SimpleHederaClient } from '../services/hedera';
import {
  HederaServiceImpl,
  isValidHederaAccountInfo,
} from '../services/impl/hedera';
import { Account } from '../types/account';
import { hederaNetworks } from '../types/constants';
import {
  HederaAccountParams,
  PulseSnapState,
  SnapDialogParams,
} from '../types/state';
import { generateWallet } from '../utils/keyPair';
import { getHederaAccountIfExists } from '../utils/params';
import { generateCommonPanel, snapDialog } from './dialog';
import { validHederaNetwork } from './network';
import { initAccountState, updateSnapState } from './state';

const getCurrentMetamaskAccount = async (): Promise<string> => {
  const accounts = (await ethereum.request({
    method: 'eth_requestAccounts',
  })) as string[];
  return accounts[0];
};

/**
 * Function that returns account info of the currently selected MetaMask account.
 *
 * @param origin - Source.
 * @param state - PulseSnapState.
 * @param params - Parameters passed.
 * @returns MetaMask Hedera client.
 */
export async function getCurrentAccount(
  origin: string,
  state: PulseSnapState,
  params: unknown,
): Promise<SimpleHederaClient> {
  try {
    const { network = 'mainnet' } = (params ?? {}) as HederaAccountParams;
    if (!validHederaNetwork(network)) {
      console.error(
        `Invalid Hedera network '${network}'. Valid networks are '${hederaNetworks.join(
          ', ',
        )}'`,
      );

      throw new Error(
        `Invalid Hedera network '${network}'. Valid networks are '${hederaNetworks.join(
          ', ',
        )}'`,
      );
    }

    return await importMetaMaskAccount(origin, snap, state, network);
  } catch (error: any) {
    console.error(`Error while trying to get the account: ${String(error)}`);
    throw new Error(`Error while trying to get the account: ${String(error)}`);
  }
}

/**
 * Veramo Import metamask account.
 *
 * @param origin - Source.
 * @param snap - SnapsGlobalObject.
 * @param state - IdentitySnapState.
 * @param network - Hedera network.
 * @returns Account.
 */
export async function importMetaMaskAccount(
  origin: string,
  snap: SnapsGlobalObject,
  state: PulseSnapState,
  network: string,
): Promise<SimpleHederaClient> {
  const metamaskAddress = await getCurrentMetamaskAccount();
  // Initialize if not there
  if (!(metamaskAddress in state.accountState)) {
    console.log(
      `The address ${metamaskAddress} has NOT yet been configured in the Hedera Pulse Snap. Configuring now...`,
    );
    await initAccountState(snap, state, metamaskAddress);
  }

  const res = await generateWallet(metamaskAddress);
  if (!res) {
    console.log('Failed to generate snap wallet for DID operations');
    throw new Error('Failed to generate snap wallet for DID operations');
  }

  const { privateKey, publicKey, address: hederaEvmAddress } = res;

  let hederaAccountId = await getHederaAccountIfExists(state, hederaEvmAddress);
  if (!hederaAccountId) {
    const hederaService = new HederaServiceImpl(network);
    const accountInfo: MirrorAccountInfo =
      await hederaService.getMirrorAccountInfo(hederaEvmAddress);
    if (accountInfo) {
      hederaAccountId = accountInfo.account;
      // eslint-disable-next-line require-atomic-updates
      state.accountState[metamaskAddress].accountId = hederaAccountId;
      // eslint-disable-next-line require-atomic-updates
      state.accountState[metamaskAddress].accountInfo = {
        alias: accountInfo.alias,
        createdTime: accountInfo.created_timestamp,
        evmAddress: accountInfo.evm_address,
        memo: accountInfo.memo,
      };
    }

    if (!hederaAccountId) {
      const dialogParamsForHederaAccountId: SnapDialogParams = {
        type: 'alert',
        content: await generateCommonPanel(origin, [
          heading('Hedera Account Status'),
          text(
            `This Hedera account is not yet active on ${network}. Please activate it by sending some HBAR to this account.`,
          ),
          divider(),
          text(`Public Key: ${publicKey}`),
          text(`EVM Address: ${hederaEvmAddress}`),
          divider(),
        ]),
      };
      await snapDialog(snap, dialogParamsForHederaAccountId);
      // TODO: Maybe offer the user an "Activate" option that will charge them "x" amount of ETH
      console.error(
        `This Hedera account is not yet active. Please activate it by sending some HBAR to this account. Public Key: ${publicKey}, EVM Address: ${hederaEvmAddress}`,
      );
      throw new Error(
        `This Hedera account is not yet active. Please activate it by sending some HBAR to this account. Public Key: ${publicKey}, EVM Address: ${hederaEvmAddress}`,
      );
    }
  }

  const hederaClient = await isValidHederaAccountInfo(
    privateKey,
    hederaAccountId,
    network,
  );
  if (!hederaClient) {
    console.error(
      `Could not setup a Hedera client with '${hederaAccountId}' at this time. Please try again later.`,
    );
    throw new Error(
      `Could not setup a Hedera client with '${hederaAccountId}' at this time. Please try again later.`,
    );
  }

  // eslint-disable-next-line require-atomic-updates
  state.currentAccount = {
    metamaskAddress,
    hederaAccountId,
    hederaEvmAddress,
    network,
  } as Account;

  await updateSnapState(snap, state);

  return hederaClient;
}
