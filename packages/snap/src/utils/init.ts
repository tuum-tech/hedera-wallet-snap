import { SnapsGlobalObject } from '@metamask/snaps-types';
import { heading, text } from '@metamask/snaps-ui';

import { generateCommonPanel, snapDialog } from '../snap/dialog';
import { initSnapState } from '../snap/state';
import { PulseSnapState, SnapDialogParams } from '../types/state';

/**
 * Init snap state.
 *
 * @param origin - Source.
 * @param snap - Snap.
 */
export async function init(
  origin: string,
  snap: SnapsGlobalObject,
): Promise<PulseSnapState> {
  const dialogParams: SnapDialogParams = {
    type: 'alert',
    content: await generateCommonPanel(origin, [
      heading('Risks about using Hedera Pulse Snap'),
      text(
        'Applications do NOT have access to your private keys. Everything is stored inside the sandbox environment of Hedera Pulse Snap inside Metamask',
      ),
    ]),
  };

  await snapDialog(dialogParams);
  console.log('starting init');
  return await initSnapState(snap);
}
