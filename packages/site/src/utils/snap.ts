import { MetaMaskInpageProvider } from '@metamask/providers';
import { defaultSnapOrigin } from '../config';
import { GetSnapsResponse, Snap } from '../types';

export const getCurrentMetamaskAccount = async (): Promise<string> => {
  const accounts = (await window.ethereum.request({
    method: 'eth_requestAccounts',
  })) as string[];
  return accounts[0];
};

export const getCurrentNetwork = async (): Promise<string> => {
  return (await window.ethereum.request({
    method: 'eth_chainId',
  })) as string;
};

/**
 * Get the installed snaps in MetaMask.
 *
 * @param provider - The MetaMask inpage provider.
 * @returns The snaps installed in MetaMask.
 */
export const getSnaps = async (
  provider?: MetaMaskInpageProvider,
): Promise<GetSnapsResponse> =>
  (await (provider ?? window.ethereum).request({
    method: 'wallet_getSnaps',
  })) as unknown as GetSnapsResponse;
/**
 * Connect a snap to MetaMask.
 *
 * @param snapId - The ID of the snap.
 * @param params - The params to pass with the snap to connect.
 */
export const connectSnap = async (
  snapId: string = defaultSnapOrigin,
  params: Record<'version' | string, unknown> = {},
): Promise<string> => {
  try {
    const hederaPulseSnap = await window.ethereum.request({
      method: 'wallet_requestSnaps',
      params: {
        [snapId]: params,
      },
    });
    console.log(
      'Hedera Pulse Snap Details: ',
      JSON.stringify(hederaPulseSnap, null, 4),
    );
    const account = await getCurrentMetamaskAccount();
    console.log('Metamask account: ', account);
    return account;
  } catch (error) {
    console.log('Could not connect to Identify Snap: ', error);
    return '';
  }
};

/**
 * Get the snap from MetaMask.
 *
 * @param version - The version of the snap to install (optional).
 * @returns The snap object returned by the extension.
 */
export const getSnap = async (version?: string): Promise<Snap | undefined> => {
  try {
    const snaps = await getSnaps();

    return Object.values(snaps).find(
      (snap) =>
        snap.id === defaultSnapOrigin && (!version || snap.version === version),
    );
  } catch (e) {
    console.log('Failed to obtain installed snap', e);
    return undefined;
  }
};

/**
 * Invoke the "hello" method from the snap.
 */

export const sendHello = async () => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: {
        method: 'hello',
        params: {},
      },
    },
  });
};

export const isLocalSnap = (snapId: string) => snapId.startsWith('local:');
