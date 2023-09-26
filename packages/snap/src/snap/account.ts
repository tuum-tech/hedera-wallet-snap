import { divider, heading, text } from '@metamask/snaps-ui';
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
import { Account } from '../types/account';
import { hederaNetworks } from '../types/constants';
import {
  HederaAccountParams,
  PulseSnapState,
  SnapDialogParams,
} from '../types/state';
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
 * Function that returns account info of the currently selected MetaMask account.
 *
 * @param origin - Source.
 * @param state - PulseSnapState.
 * @param params - Parameters that were passed by the user.
 * @returns MetaMask Hedera client.
 */
export async function setCurrentAccount(
  origin: string,
  state: PulseSnapState,
  params: unknown,
): Promise<void> {
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

    const metamaskAddress = await getCurrentMetamaskAccount();
    // Retrieve the values if already in state
    if (!Object.keys(state.accountState).includes(metamaskAddress)) {
      // Initialize if not in snap state
      console.log(
        `The address ${metamaskAddress} has NOT yet been configured in the Hedera Pulse Snap. Configuring now...`,
      );
      await initAccountState(snap, state, metamaskAddress);
    }

    await importMetaMaskAccount(origin, state, network, metamaskAddress);
  } catch (error: any) {
    console.error(`Error while trying to get the account: ${String(error)}`);
    throw new Error(`Error while trying to get the account: ${String(error)}`);
  }
}

/**
 * Veramo Import metamask account.
 *
 * @param origin - Source.
 * @param state - IdentitySnapState.
 * @param network - Hedera network.
 * @param metamaskAddress - EVM address.
 */
export async function importMetaMaskAccount(
  origin: string,
  state: PulseSnapState,
  network: string,
  metamaskAddress: string,
): Promise<void> {
  let { privateKey, publicKey, address } =
    state.accountState[metamaskAddress].keyStore;
  let balance = state.accountState[metamaskAddress].accountInfo
    .balance as AccountBalance;

  if (_.isEmpty(privateKey)) {
    const res = await generateWallet(metamaskAddress);
    if (!res) {
      console.log('Failed to generate snap wallet for DID operations');
      throw new Error('Failed to generate snap wallet for DID operations');
    }
    const {
      privateKey: _privateKey,
      publicKey: _publicKey,
      address: _address,
    } = res;
    privateKey = _privateKey;
    publicKey = _publicKey;
    address = _address;
  }

  // eslint-disable-next-line require-atomic-updates
  state.accountState[metamaskAddress].keyStore = {
    privateKey,
    publicKey,
    address,
  };

  let hederaAccountId = await getHederaAccountIdIfExists(state, address);
  if (_.isEmpty(hederaAccountId)) {
    const hederaService = new HederaServiceImpl(network);
    const accountInfo: MirrorAccountInfo =
      await hederaService.getMirrorAccountInfo(address);
    if (!_.isEmpty(accountInfo)) {
      hederaAccountId = accountInfo.account;
      // eslint-disable-next-line require-atomic-updates
      state.accountState[metamaskAddress].accountId = hederaAccountId;

      const accountBalance = accountInfo.balance;
      const hbars = accountBalance.balance / 100000000;
      const tokens = new Map<string, TokenBalance>();

      // Use map to create an array of promises
      const tokenPromises = accountBalance.tokens.map(async (token: Token) => {
        const tokenId = token.token_id;
        const tokenInfo: MirrorTokenInfo = await hederaService.getTokenById(
          tokenId,
        );
        tokens.set(tokenId, {
          balance: token.balance,
          decimals: Number(tokenInfo.decimals),
        } as TokenBalance);
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

      console.log(
        'created_timestamp: ',
        accountInfo.created_timestamp,
        typeof accountInfo.created_timestamp,
      );
      // eslint-disable-next-line require-atomic-updates
      state.accountState[metamaskAddress].accountInfo = {
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
          text(`Public Key: ${publicKey}`),
          text(`EVM Address: ${address}`),
          divider(),
        ]),
      };
      await snapDialog(dialogParamsForHederaAccountId);

      // TODO: Maybe offer the user an "Activate" option that will charge them "x" amount of ETH
      console.error(
        `This Hedera account is not yet active. Please activate it by sending some HBAR to this account. Public Key: ${publicKey}, EVM Address: ${address}`,
      );
      throw new Error(
        `This Hedera account is not yet active. Please activate it by sending some HBAR to this account. Public Key: ${publicKey}, EVM Address: ${address}`,
      );
    }
  }

  // eslint-disable-next-line require-atomic-updates
  state.currentAccount = {
    metamaskAddress,
    hederaAccountId,
    hederaEvmAddress: address,
    balance,
    network,
  } as Account;

  await updateSnapState(snap, state);
}

/**
 * Create Hedera Client to use for transactions.
 *
 * @param privateKey - Private key of the account.
 * @param hederaAccountId - Hedera Account ID.
 * @param network - Hedera network.
 */
export async function createHederaClient(
  privateKey: string,
  hederaAccountId: string,
  network: string,
): Promise<SimpleHederaClient> {
  const hederaClient = await getHederaClient(
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
