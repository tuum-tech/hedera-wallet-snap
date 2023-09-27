import _ from 'lodash';
import { Account } from '../types/account';
import { PulseSnapState } from '../types/state';
import { getEmptyAccountState, getInitialSnapState } from '../utils/config';

/**
 * Function for updating PulseSnapState object in the MetaMask state.
 *
 * @public
 * @param snapState - Object to replace the current object in the MetaMask state.
 */
export async function updateSnapState(snapState: PulseSnapState) {
  await snap.request({
    method: 'snap_manageState',
    params: {
      operation: 'update',
      newState: JSON.parse(JSON.stringify(snapState)),
    },
  });
}

/**
 * Function to retrieve PulseSnapState object from the MetaMask state.
 *
 * @public
 * @returns Object from the state.
 */
export async function getSnapState(): Promise<PulseSnapState> {
  const state = (await snap.request({
    method: 'snap_manageState',
    params: { operation: 'get' },
  })) as PulseSnapState | null;

  if (state === null || _.isEmpty(state)) {
    throw Error('PulseSnapState is not initialized!');
  }

  return state;
}

/**
 * Function to retrieve PulseSnapState object from the MetaMask state.
 *
 * @public
 * @returns Object from the state.
 */
export async function getSnapStateUnchecked(): Promise<PulseSnapState | null> {
  const state = (await snap.request({
    method: 'snap_manageState',
    params: { operation: 'get' },
  })) as PulseSnapState | null;

  return state;
}

/**
 * Function to initialize PulseSnapState object.
 *
 * @public
 * @returns Object.
 */
export async function initSnapState(): Promise<PulseSnapState> {
  const state = getInitialSnapState();
  await updateSnapState(state);
  return state;
}

/**
 * Function that creates an empty IdentitySnapState object in the Identity Snap state for the provided address.
 *
 * @param state - PulseSnapState.
 * @param evmAddress - The account address.
 */
export async function initAccountState(
  state: PulseSnapState,
  evmAddress: string,
): Promise<void> {
  state.currentAccount = { metamaskAddress: evmAddress } as Account;
  state.accountState[evmAddress] = getEmptyAccountState();
  await updateSnapState(state);
}

/**
 * Check if Hedera account was imported.
 *
 * @param state - PulseSnapState.
 * @param evmAddress - Ethereum address.
 * @returns Result.
 */
export async function getHederaAccountIdIfExists(
  state: PulseSnapState,
  evmAddress: string,
): Promise<string> {
  let result = '';
  for (const address of Object.keys(state.accountState)) {
    const { keyStore } = state.accountState[address];
    if (keyStore.address === evmAddress) {
      result = keyStore.hederaAccountId;
    }
  }
  return result;
}
