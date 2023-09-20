import { SnapsGlobalObject } from '@metamask/snaps-types';

import { PulseSnapState } from '../types/state';
import { updateSnapState } from './state';

/**
 * Function that lets you add a friendly dApp.
 *
 * @param snap - Snap.
 * @param state - PulseSnapState.
 * @param dapp - Dapp.
 */
export async function addFriendlyDapp(
  snap: SnapsGlobalObject,
  state: PulseSnapState,
  dapp: string,
) {
  state.snapConfig.dApp.friendlyDapps.push(dapp);
  await updateSnapState(snap, state);
}

/**
 * Function that removes a friendly dApp.
 *
 * @param snap - Snap.
 * @param state - PulseSnapState.
 * @param dapp - Dapp.
 */
export async function removeFriendlyDapp(
  snap: SnapsGlobalObject,
  state: PulseSnapState,
  dapp: string,
) {
  // FIXME: TEST IF YOU CAN REFERENCE FRIENDLY DAPS
  // let friendlyDapps = state.snapConfig.dApp.friendlyDapps;
  // friendlyDapps = friendlyDapps.filter((app) => app !== dapp);
  state.snapConfig.dApp.friendlyDapps =
    state.snapConfig.dApp.friendlyDapps.filter((app) => app !== dapp);
  await updateSnapState(snap, state);
}
