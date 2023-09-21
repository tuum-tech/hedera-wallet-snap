import { PrivateKey } from '@hashgraph/sdk';
import { SLIP10Node } from '@metamask/key-tree';
import { assert } from 'ethers';
import { Wallet } from '../domain/wallet/abstract';
import { PrivateKeySoftwareWallet } from '../domain/wallet/software-private-key';
import { DEFAULTCOINTYPE } from '../types/constants';

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
 * @param curve - Public key algorithm(secp256k1 or ed25519).
 * @param addressIndex - Address index of the account.
 * @returns SLIP10Node.
 */
export async function snapGetKeysFromAddressIndex(
  curve: 'ed25519' | 'secp256k1',
  addressIndex: number,
): Promise<PrivateKey> {
  const rootNode = await snap.request({
    method: 'snap_getBip32Entropy',
    params: {
      path: [`m`, `44'`, `${DEFAULTCOINTYPE}'`],
      curve,
    },
  });

  assert(
    rootNode.privateKey !== undefined,
    'No private key provided in rootNode',
    'UNSUPPORTED_OPERATION',
  );

  // Next, create an instance of a SLIP-10 node for the Hedera Hashgraph node.
  const node = await SLIP10Node.fromJSON(rootNode);

  // m / 44' / 3030' / addressIndex'
  const keypair: SLIP10Node = await node.derive([`slip10:${addressIndex}'`]);

  assert(
    keypair.privateKeyBytes !== undefined,
    'PrivateKeyBytes is undefined for the keypair',
    'UNSUPPORTED_OPERATION',
  );

  if (curve === 'ed25519') {
    return await PrivateKey.fromSeedED25519(
      Uint8Array.from(keypair.privateKeyBytes),
    );
  }
  return await PrivateKey.fromSeedECDSAsecp256k1(
    Uint8Array.from(keypair.privateKeyBytes),
  );
}
