import cloneDeep from 'lodash.clonedeep';

import { Wallet } from '../domain/wallet/abstract';
import { Account, PulseAccountState, PulseSnapState } from '../types/state';

const emptyAccountState = {
  wallet: {} as Wallet,
  accountIds: [],
} as PulseAccountState;

export const getEmptyAccountState = () => {
  return cloneDeep(emptyAccountState);
};

const initialSnapState: PulseSnapState = {
  currentAccount: {} as Account,
  accountState: {},
  snapConfig: {
    dApp: {
      disablePopups: false,
      friendlyDapps: [],
    },
    snap: {
      acceptedTerms: true,
    },
  },
};

export const getInitialSnapState = () => {
  return cloneDeep(initialSnapState);
};
