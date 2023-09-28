import { PrivateKey } from '@hashgraph/sdk';
import { divider, heading, text } from '@metamask/snaps-ui';
import { Wallet, ethers } from 'ethers';
import _ from 'lodash';
import {
  AccountBalance,
  MirrorAccountInfo,
  MirrorTokenInfo,
  SimpleHederaClient,
  Token,
  TokenBalance,
} from '../services/hedera';
import { HederaServiceImpl, getHederaClient } from '../services/impl/hedera';
import { Account, ExternalAccount, NetworkParams } from '../types/account';
import { hederaNetworks } from '../types/constants';
import { KeyStore, PulseSnapState, SnapDialogParams } from '../types/state';
import { generateWallet } from '../utils/keyPair';
import { generateCommonPanel, snapDialog } from './dialog';
import { validHederaNetwork } from './network';
import {
  getHederaAccountIdIfExists,
  initAccountState,
  updateSnapState,
} from './state';

const getCurrentMetamaskAccount = async (): Promise<string> => {
  const accounts = (await ethereum.request({
    method: 'eth_requestAccounts',
  })) as string[];
  return accounts[0];
};

/**
 * Adds the prefix to the EVM address.
 *
 * @param address - EVM Account address.
 * @returns EVM address.
 */
function ensure0xPrefix(address: string): string {
  let result = address;
  if (!address.startsWith('0x')) {
    result = `0x${address}`;
  }
  return result.toLowerCase();
}

/**
 * Function that returns account info of the currently selected MetaMask account.
 *
 * @param origin - Source.
 * @param state - PulseSnapState.
 * @param params - Parameters that were passed by the user.
 * @param isExternalAccount - Whether this is a metamask or a non-metamask account.
 * @returns MetaMask Hedera client.
 */
export async function setCurrentAccount(
  origin: string,
  state: PulseSnapState,
  params: unknown,
  isExternalAccount: boolean,
): Promise<void> {
  try {
    const { network = 'mainnet' } = (params ?? {}) as NetworkParams;
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

    let connectedAddress = '';
    let keyStore = {} as KeyStore;
    // Handle external account(non-metamask account)
    if (isExternalAccount) {
      const nonMetamaskAccount = params as ExternalAccount;
      const { accountIdOrEvmAddress, curve = 'ECDSA_SECP256K1' } =
        nonMetamaskAccount.externalAccount;
      if (ethers.isAddress(accountIdOrEvmAddress)) {
        if (curve !== 'ECDSA_SECP256K1') {
          console.error(
            `You must use 'ECDSA_SECP256K1' as the curve if you want to import an EVM address. Please make sure to pass in the correct value for "curve".`,
          );
          throw new Error(
            `You must use 'ECDSA_SECP256K1' as the curve if you want to import an EVM address. Please make sure to pass in the correct value for "curve".`,
          );
        }

        const { connectedAddress: _connectedAddress, keyStore: _keyStore } =
          await connectEVMAccount(
            origin,
            state,
            curve,
            ensure0xPrefix(accountIdOrEvmAddress),
          );
        connectedAddress = _connectedAddress;
        keyStore = _keyStore;
      } else {
        try {
          const { connectedAddress: _connectedAddress, keyStore: _keyStore } =
            await connectHederaAccount(
              origin,
              state,
              network,
              curve,
              (accountIdOrEvmAddress as string).toLowerCase(),
            );
          connectedAddress = _connectedAddress;
          keyStore = _keyStore;
        } catch (error: any) {
          console.error(
            `Could not connect to '${
              accountIdOrEvmAddress as string
            }'. Please try again: ${String(error)}`,
          );
          throw new Error(
            `Could not connect to '${
              accountIdOrEvmAddress as string
            }'. Please try again: ${String(error)}`,
          );
        }
      }
    } else {
      // Handle metamask connected account
      connectedAddress = await getCurrentMetamaskAccount();
    }

    connectedAddress = connectedAddress.toLowerCase();

    // Retrieve the values if already in state
    if (!Object.keys(state.accountState).includes(connectedAddress)) {
      // Initialize if not in snap state
      console.log(
        `The address ${connectedAddress} has NOT yet been configured in the Hedera Pulse Snap. Configuring now...`,
      );
      await initAccountState(state, connectedAddress);
    }

    await importMetaMaskAccount(
      origin,
      state,
      network,
      connectedAddress,
      keyStore,
      isExternalAccount,
    );
  } catch (error: any) {
    console.error(`Error while trying to get the account: ${String(error)}`);
    throw new Error(`Error while trying to get the account: ${String(error)}`);
  }
}

/**
 * Connect EVM Account.
 *
 * @param origin - Source.
 * @param state - Pulse state.
 * @param curve - Public Key curve('ECDSA_SECP256K1' | 'ED25519').
 * @param evmAddress - EVM Account address.
 */
async function connectEVMAccount(
  origin: string,
  state: PulseSnapState,
  curve: 'ECDSA_SECP256K1' | 'ED25519',
  evmAddress: string,
): Promise<any> {
  let result = {} as KeyStore;
  let connectedAddress = '';
  for (const addr of Object.keys(state.accountState)) {
    const { keyStore } = state.accountState[addr];

    if (evmAddress === addr) {
      connectedAddress = addr;
      result = keyStore;
      break;
    }

    if (evmAddress === keyStore.address) {
      connectedAddress = addr;
      result = keyStore;
      break;
    }
  }

  if (_.isEmpty(connectedAddress)) {
    const dialogParamsForPrivateKey: SnapDialogParams = {
      type: 'prompt',
      content: await generateCommonPanel(origin, [
        heading('Connect to EVM Account'),
        text('Enter private key for the following account'),
        divider(),
        text(`EVM Address: ${evmAddress}`),
      ]),
      placeholder: '2386d1d21644dc65d...', // You can use '2386d1d21644dc65d4e4b9e2242c5f155cab174916cbc46ad85622cdaeac835c' for testing purposes
    };
    const privateKey = (await snapDialog(dialogParamsForPrivateKey)) as string;

    try {
      const wallet: Wallet = new ethers.Wallet(privateKey);
      if (evmAddress !== wallet.address) {
        console.error(
          `The private key you passed was invalid for the EVM address '${evmAddress}'. Please try again.`,
        );
        throw new Error(
          `The private key you passed was invalid for the EVM address '${evmAddress}'. Please try again.`,
        );
      }
      result.curve = curve;
      result.privateKey = privateKey;
      result.publicKey = wallet.signingKey.publicKey;
      result.address = ensure0xPrefix(wallet.address);
      connectedAddress = ensure0xPrefix(wallet.address);
    } catch (error: any) {
      console.error(
        'Error while trying to retrieve the private key. Please try again.',
      );
      throw new Error(
        'Error while trying to retrieve the private key. Please try again.',
      );
    }
  }

  return {
    connectedAddress,
    keyStore: result,
  };
}

/**
 * Connect Hedera Account.
 *
 * @param origin - Source.
 * @param state - Pulse state.
 * @param network - Hedera network.
 * @param curve - Public Key curve('ECDSA_SECP256K1' | 'ED25519').
 * @param accountId - Hedera Account id.
 */
async function connectHederaAccount(
  origin: string,
  state: PulseSnapState,
  network: string,
  curve: 'ECDSA_SECP256K1' | 'ED25519',
  accountId: string,
): Promise<any> {
  let result = {} as KeyStore;
  let connectedAddress = '';
  for (const addr of Object.keys(state.accountState)) {
    const { keyStore } = state.accountState[addr];
    if (keyStore.hederaAccountId === accountId) {
      connectedAddress = addr;
      result = keyStore;
      break;
    }
  }

  if (_.isEmpty(connectedAddress)) {
    const dialogParamsForPrivateKey: SnapDialogParams = {
      type: 'prompt',
      content: await generateCommonPanel(origin, [
        heading('Connect to Hedera Account'),
        text('Enter private key for the following account'),
        divider(),
        text(`Account Id: ${accountId}`),
      ]),
      placeholder: '2386d1d21644dc65d...', // You can use '2386d1d21644dc65d4e4b9e2242c5f155cab174916cbc46ad85622cdaeac835c' for testing purposes
    };
    const privateKey = (await snapDialog(dialogParamsForPrivateKey)) as string;

    try {
      const hederaService = new HederaServiceImpl(network);
      const accountInfo: MirrorAccountInfo =
        await hederaService.getMirrorAccountInfo(accountId);
      const publicKey =
        PrivateKey.fromString(privateKey).publicKey.toStringRaw();
      if (_.isEmpty(accountInfo)) {
        const dialogParamsForHederaAccountId: SnapDialogParams = {
          type: 'alert',
          content: await generateCommonPanel(origin, [
            heading('Hedera Account Status'),
            text(
              `This Hedera account is not yet active on ${network}. Please activate it by sending some HBAR to this account on '${network}'.`,
            ),
            divider(),
            text(`Public Key: ${publicKey}`),
            divider(),
          ]),
        };
        await snapDialog(dialogParamsForHederaAccountId);

        console.error(
          `This Hedera account is not yet active. Please activate it by sending some HBAR to this account on '${network}'. Public Key: ${publicKey}`,
        );
        throw new Error(
          `This Hedera account is not yet active. Please activate it by sending some HBAR to this account on '${network}'. Public Key: ${publicKey}`,
        );
      }

      if (accountInfo.key._type !== curve) {
        console.error(
          `You passed '${curve}' as the digital signature algorithm to use but the account '${accountId}' was derived using '${accountInfo.key._type}' on '${network}'. Please make sure to pass in the correct value for "curve".`,
        );
        throw new Error(
          `You passed '${curve}' as the digital signature algorithm to use but the account '${accountId}' was derived using '${accountInfo.key._type}' on '${network}'. Please make sure to pass in the correct value for "curve".`,
        );
      }

      const hederaClient = await getHederaClient(
        curve,
        privateKey,
        accountId,
        network,
      );
      if (hederaClient) {
        result.privateKey = hederaClient
          ?.getPrivateKey()
          ?.toStringRaw() as string;
        result.curve = curve;
        result.publicKey = hederaClient.getPublicKey().toStringRaw();
        result.hederaAccountId = accountId;
        result.address = ensure0xPrefix(accountInfo.evm_address);
        connectedAddress = ensure0xPrefix(accountInfo.evm_address);
      } else {
        const dialogParamsForHederaAccountId: SnapDialogParams = {
          type: 'alert',
          content: await generateCommonPanel(origin, [
            heading('Hedera Account Status'),
            text(
              `The private key you passed is not associated with the Hedera account '${accountId}'`,
            ),
            divider(),
            text(`EVM address: ${result.address}`),
            divider(),
          ]),
        };
        await snapDialog(dialogParamsForHederaAccountId);

        console.error(
          `The private key you passed is not associated with the Hedera account '${accountId}'`,
        );
        throw new Error(
          `The private key you passed is not associated with the Hedera account '${accountId}'`,
        );
      }
    } catch (error: any) {
      console.error(
        `Could not setup a Hedera client. Please try again: ${String(error)}`,
      );
      throw new Error(
        `Could not setup a Hedera client. Please try again: ${String(error)}`,
      );
    }
  }

  return {
    connectedAddress,
    keyStore: result,
  };
}

/**
 * Veramo Import metamask account.
 *
 * @param origin - Source.
 * @param state - IdentitySnapState.
 * @param network - Hedera network.
 * @param connectedAddress - Currently connected EVm address.
 * @param keyStore - Keystore for private, public keys and EVM address.
 * @param isExternalAccount - Whether this is a metamask or a non-metamask account.
 */
export async function importMetaMaskAccount(
  origin: string,
  state: PulseSnapState,
  network: string,
  connectedAddress: string,
  keyStore: KeyStore,
  isExternalAccount: boolean,
): Promise<void> {
  let curve = '';
  let privateKey = '';
  let publicKey = '';
  let address = '';
  let hederaAccountId = '';
  let idOrAliasOrEvmAddress = '';

  if (isExternalAccount) {
    curve = keyStore.curve;
    privateKey = keyStore.privateKey;
    publicKey = keyStore.publicKey;
    address = keyStore.address;
    hederaAccountId = keyStore.hederaAccountId;
  } else {
    const { keyStore: ksInner } = state.accountState[connectedAddress];
    curve = ksInner.curve;
    privateKey = ksInner.privateKey;
    publicKey = ksInner.publicKey;
    address = ksInner.address;

    if (_.isEmpty(privateKey)) {
      // Generate a new wallet according to the Hedera Pulse's entrophy combined with the currently connected EVM address
      const res = await generateWallet(connectedAddress);
      if (!res) {
        console.log('Failed to generate snap wallet for DID operations');
        throw new Error('Failed to generate snap wallet for DID operations');
      }
      curve = 'ECDSA_SECP256K1';
      privateKey = res.privateKey;
      publicKey = res.publicKey;
      address = res.address;
    }
    hederaAccountId = await getHederaAccountIdIfExists(state, address);
  }

  address = address.toLowerCase();

  if (_.isEmpty(hederaAccountId)) {
    idOrAliasOrEvmAddress = address;
  } else {
    idOrAliasOrEvmAddress = hederaAccountId;
  }

  let { balance } = state.accountState[connectedAddress].accountInfo;
  if (
    _.isEmpty(hederaAccountId) ||
    _.isEmpty(state.accountState[connectedAddress].accountInfo)
  ) {
    const hederaService = new HederaServiceImpl(network);
    const accountInfo: MirrorAccountInfo =
      await hederaService.getMirrorAccountInfo(idOrAliasOrEvmAddress);
    if (!_.isEmpty(accountInfo)) {
      hederaAccountId = accountInfo.account;

      // Make sure that the EVM address of this accountId matches the one on Hedera
      if (accountInfo.evm_address !== address) {
        console.error(
          `The Hedera account '${hederaAccountId}' is associated with the EVM address '${accountInfo.evm_address}' but you tried to associate it with the address '${address}.`,
        );
        throw new Error(
          `The Hedera account '${hederaAccountId}' is associated with the EVM address '${accountInfo.evm_address}' but you tried to associate it with the address '${address}.`,
        );
      }

      const accountBalance = accountInfo.balance;
      const hbars = accountBalance.balance / 1e8;
      const tokens: Record<string, TokenBalance> = {};

      // Use map to create an array of promises
      const tokenPromises = accountBalance.tokens.map(async (token: Token) => {
        const tokenId = token.token_id;
        const tokenInfo: MirrorTokenInfo = await hederaService.getTokenById(
          tokenId,
        );
        tokens[tokenId] = {
          balance: token.balance / Math.pow(10, Number(tokenInfo.decimals)),
          decimals: Number(tokenInfo.decimals),
          tokenId,
          name: tokenInfo.name,
          symbol: tokenInfo.symbol,
          tokenType: tokenInfo.type,
          supplyType: tokenInfo.supply_type,
          totalSupply: tokenInfo.total_supply,
          maxSupply: tokenInfo.max_supply,
        } as TokenBalance;
      });

      // Wait for all promises to resolve
      await Promise.all(tokenPromises);

      balance = {
        hbars,
        timestamp: new Date(
          parseFloat(accountBalance.timestamp) * 1000,
        ).toISOString(),
        tokens,
      } as AccountBalance;

      // eslint-disable-next-line require-atomic-updates
      state.accountState[connectedAddress].accountInfo = {
        alias: accountInfo.alias,
        createdTime: new Date(
          parseFloat(accountInfo.created_timestamp) * 1000,
        ).toISOString(),
        memo: accountInfo.memo,
        balance,
        // TODO: Run a cronjob occasionally that runs getAccountInfo and getBalance
        // balance: via cronjob
        // extradata: via cronjob
      };
    }

    if (_.isEmpty(hederaAccountId)) {
      const dialogParamsForHederaAccountId: SnapDialogParams = {
        type: 'alert',
        content: await generateCommonPanel(origin, [
          heading('Hedera Account Status'),
          text(
            `This Hedera account is not yet active on ${network}. Please activate it by sending some HBAR to this account.`,
          ),
          divider(),
          text(`EVM Address: ${address}`),
          divider(),
        ]),
      };
      await snapDialog(dialogParamsForHederaAccountId);

      // TODO: Maybe offer the user an "Activate" option that will charge them "x" amount of ETH
      console.error(
        `This Hedera account is not yet active. Please activate it by sending some HBAR to this account. EVM Address: ${address}`,
      );
      throw new Error(
        `This Hedera account is not yet active. Please activate it by sending some HBAR to this account. EVM Address: ${address}`,
      );
    }
  }

  // eslint-disable-next-line require-atomic-updates
  state.currentAccount = {
    metamaskAddress: connectedAddress,
    hederaAccountId,
    hederaEvmAddress: address,
    balance,
    network,
  } as Account;

  // eslint-disable-next-line require-atomic-updates
  state.accountState[connectedAddress].keyStore = {
    curve: curve as 'ECDSA_SECP256K1' | 'ED25519',
    privateKey,
    publicKey,
    address,
    hederaAccountId,
  };

  await updateSnapState(state);
}

/**
 * Create Hedera Client to use for transactions.
 *
 * @param curve - Curve that was used to derive the keys('ECDSA_SECP256K1' | 'ED25519').
 * @param privateKey - Private key of the account.
 * @param hederaAccountId - Hedera Account ID.
 * @param network - Hedera network.
 */
export async function createHederaClient(
  curve: string,
  privateKey: string,
  hederaAccountId: string,
  network: string,
): Promise<SimpleHederaClient> {
  const hederaClient = await getHederaClient(
    curve,
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

  return hederaClient;
}
