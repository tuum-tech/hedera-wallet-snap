import { OnRpcRequestHandler } from '@metamask/snaps-types';
import { panel, text } from '@metamask/snaps-ui';

import { getAccountInfo } from './rpc/account/getAccountInfo';
import { SimpleHederaClient } from './services/hedera';
import { getCurrentAccount } from './snap/account';
import { getSnapStateUnchecked } from './snap/state';
import { PulseSnapParams } from './types/state';
import { init } from './utils/init';

/**
 * Handle incoming JSON-RPC requests, sent through `wallet_invokeSnap`.
 *
 * @param args - The request handler args as object.
 * @param args.origin - The origin of the request, e.g., the website that
 * invoked the snap.
 * @param args.request - A validated JSON-RPC request object.
 * @returns The result of `snap_dialog`.
 * @throws If the request method is not valid for this snap.
 */
export const onRpcRequest: OnRpcRequestHandler = async ({
  origin,
  request,
}) => {
  console.log('Request:', JSON.stringify(request, null, 4));
  console.log('Origin:', origin);
  console.log('-------------------------------------------------------------');
  console.log(
    'request.params=========',
    JSON.stringify(request.params, null, 4),
  );

  let state = await getSnapStateUnchecked(snap);
  if (state === null) {
    state = await init(origin, snap);
  }
  console.log('state:', JSON.stringify(state, null, 4));

  const hederaClient: SimpleHederaClient = await getCurrentAccount(
    origin,
    state,
    request.params,
  );
  console.log(
    `Current account: ${JSON.stringify(state.currentAccount, null, 4)}`,
  );

  const pulseSnapParams: PulseSnapParams = {
    origin,
    snap,
    state,
    hederaClient,
  };

  switch (request.method) {
    case 'hello':
      await snap.request({
        method: 'snap_dialog',
        params: {
          type: 'confirmation',
          content: panel([
            text(`Hello, **${origin}**!`),
            text('This custom confirmation is just for display purposes.'),
            text(
              'But you can edit the snap source code to make it do something, if you want to!',
            ),
          ]),
        },
      });
      return {
        currentAccount: state.currentAccount,
      };
    case 'getAccountInfo': {
      return {
        currentAccount: state.currentAccount,
        accountInfo: await getAccountInfo(pulseSnapParams),
      };
    }
    default:
      throw new Error('Method not found.');
  }
};
