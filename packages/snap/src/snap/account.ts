import { SnapsGlobalObject } from '@metamask/snaps-types';

import { divider, heading, text } from '@metamask/snaps-ui';
import { ec as EC } from 'elliptic';
import { Wallet } from 'ethers';
import { MirrorAccountInfo, SimpleHederaClient } from '../services/hedera';
import {
  HederaServiceImpl,
  isValidHederaAccountInfo,
} from '../services/impl/hedera';
import { hederaNetworks } from '../types/constants';
import {
  Account,
  HederaAccountParams,
  PulseSnapState,
  SnapDialogParams,
} from '../types/state';
import { snapGetKeysFromAddressIndex } from '../utils/keyPair';
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
  // Public key algorithm(secp256k1 or ed25519).
  /* const slip10TypeNode = await getAddressKeyDeriver(snap, 'ed25519');
  const _wallet = new Wallet(slip10TypeNode.privateKey as string);
  console.log('slip10TypeNode: ', _wallet.privateKey, _wallet.address); */

  // We always connect to the first account in Metamask
  const privateKeyHedera = await snapGetKeysFromAddressIndex('secp256k1', 0);
  if (!privateKeyHedera) {
    console.log('Failed to get private keys from Metamask account');
    throw new Error('Failed to get private keys from Metamask account');
  }

  const publicKeyHex: string = privateKeyHedera.toStringRaw();
  const privateKeyHex: string = privateKeyHedera.publicKey.toStringRaw();
  console.log('publicKey: ', publicKeyHex);
  console.log('privateKey: ', privateKeyHex);

  const wallet: Wallet = new Wallet(publicKeyHex);
  const { privateKey, address } = wallet;
  const hederaEvmAddress = address;
  // Initialize if not there
  if (!(hederaEvmAddress in state.accountState)) {
    console.log(
      `The address ${hederaEvmAddress} has NOT yet been configured in the Hedera Pulse Snap. Configuring now...`,
    );
    await initAccountState(snap, state, hederaEvmAddress);
  }

  const ec = new EC('secp256k1');
  const compressPublicKey = (uncompressedKeyHex: string): string => {
    // Remove the '0x' prefix if it exists
    const keyWithoutPrefix = uncompressedKeyHex.startsWith('0x')
      ? uncompressedKeyHex.slice(2)
      : uncompressedKeyHex;
    // Check if the public key is valid for secp256k1
    try {
      const publicKey = ec.keyFromPublic(keyWithoutPrefix, 'hex');
      return publicKey.getPublic(true, 'hex');
    } catch (error) {
      // If the public key is not valid for secp256k1, return the original key because it's likely ed25519
      return uncompressedKeyHex;
    }
  };
  const publicKey = compressPublicKey(publicKeyHex);

  let hederaAccountId = await getHederaAccountIfExists(state, hederaEvmAddress);
  if (!hederaAccountId) {
    const hederaService = new HederaServiceImpl(network);
    const accountInfo: MirrorAccountInfo =
      await hederaService.getMirrorAccountInfo(undefined, publicKey);
    console.log('accountInfo: ', accountInfo);
    if (accountInfo) {
      hederaAccountId = accountInfo.account;
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
