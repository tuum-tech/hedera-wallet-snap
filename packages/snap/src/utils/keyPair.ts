import { PrivateKey } from '@hashgraph/sdk';
import { JsonSLIP10Node, SLIP10Node } from '@metamask/key-tree';
import { SnapsGlobalObject } from '@metamask/snaps-types';
import { assert } from 'ethers';
import { Wallet } from '../domain/wallet/abstract';
import { PrivateKeySoftwareWallet } from '../domain/wallet/software-private-key';
import { DEFAULTCOINTYPE } from '../types/constants';

/**
 * Function to get address key deriver.
 *
 * @param snap - Snap.
 * @param curve - Public key algorithm(secp256k1 or ed25519).
 * @returns JsonSLIP10Node.
 */
export async function getAddressKeyDeriver(
  snap: SnapsGlobalObject,
  curve: 'ed25519' | 'secp256k1',
) {
  const slip10TypeNode: JsonSLIP10Node = (await snap.request({
    method: 'snap_getBip32Entropy',
    params: {
      path: [`m`, `44'`, `${DEFAULTCOINTYPE}'`],
      curve,
    },
  })) as JsonSLIP10Node;
  return slip10TypeNode;
}

/**
 * Function to generate Hedera Wallet.
 *
 * @param _privateKey - Private key of the wallet.
 * @returns Wallet.
 */
export async function generateHederaWallet(
  _privateKey: string,
): Promise<Wallet> {
  const privateKey = PrivateKey.fromStringECDSA(_privateKey);
  return new PrivateKeySoftwareWallet(privateKey);
}

/**
 * Function to get address key deriver.
 *
 * @param slip10TypeNode - JsonSLIP10Node.
 * @param addressIndex - Address index of the account.
 * @returns SLIP10Node.
 */
export async function snapGetKeysFromAddressIndex(
  slip10TypeNode: JsonSLIP10Node,
  addressIndex: number,
): Promise<SLIP10Node> {
  assert(
    slip10TypeNode.privateKey !== undefined,
    'No private key provided in JsonSLIP10Node',
    'UNSUPPORTED_OPERATION',
  );
  // Next, create an instance of a SLIP-10 node for the Hedera Hashgraph node.
  const node = await SLIP10Node.fromJSON(slip10TypeNode); // node at depth 2
  // m / 44' / 3030' / addressIndex'
  const accountKey: SLIP10Node = await node.derive([`slip10:${addressIndex}'`]);
  return accountKey;
}
