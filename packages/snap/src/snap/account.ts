import { SnapsGlobalObject } from '@metamask/snaps-types';

import { SimpleHederaClient } from '../services/hedera';
import { isValidHederaAccountInfo } from '../services/impl/hedera';
import { hederaNetworks } from '../types/constants';
import { Account, HederaAccountParams, PulseSnapState } from '../types/state';
import {
  getAddressKeyDeriver,
  snapGetKeysFromAddressIndex,
} from '../utils/keyPair';
import { getHederaAccountIfExists } from '../utils/params';
import { requestHederaAccountId } from './dialog';
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
  const slip10TypeNode = await getAddressKeyDeriver(snap, 'secp256k1');
  // We always connect to the first account in Metamask
  const res = await snapGetKeysFromAddressIndex(slip10TypeNode, 0);
  if (!res) {
    console.log('Failed to get private keys from Metamask account');
    throw new Error('Failed to get private keys from Metamask account');
  }
  const hederaEvmAddress = res.address;
  // Initialize if not there
  if (!(hederaEvmAddress in state.accountState)) {
    console.log(
      `The address ${hederaEvmAddress} has NOT yet been configured in the Hedera Pulse Snap. Configuring now...`,
    );
    await initAccountState(snap, state, hederaEvmAddress);
  }

  let hederaAccountId = await getHederaAccountIfExists(state, hederaEvmAddress);
  if (!hederaAccountId) {
    hederaAccountId = await requestHederaAccountId(
      origin,
      snap,
      hederaEvmAddress,
    );
  }
  const privateKey = res.privateKey?.split('0x')[1] as string;
  const hederaClient = await isValidHederaAccountInfo(
    privateKey,
    hederaAccountId,
    network,
  );
  if (!hederaClient) {
    console.error(
      `Could not retrieve hedera account info using the accountId '${hederaAccountId}'`,
    );
    throw new Error(
      `Could not retrieve hedera account info using the accountId '${hederaAccountId}'`,
    );
  }

  // eslint-disable-next-line require-atomic-updates
  state.currentAccount = {
    metamaskAddress: await getCurrentMetamaskAccount(),
    hederaAccountId,
    hederaEvmAddress,
    network,
  } as Account;
  // eslint-disable-next-line require-atomic-updates
  state.accountState[hederaEvmAddress].accountIds = [hederaAccountId];

  await updateSnapState(snap, state);

  return hederaClient;
}
