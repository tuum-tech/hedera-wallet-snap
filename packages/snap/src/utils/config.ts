import cloneDeep from 'lodash.clonedeep';

import { Account, AccountInfo } from '../types/account';
import { PulseAccountState, PulseSnapState } from '../types/state';

const emptyAccountState = {
  accountId: '',
  accountInfo: {} as AccountInfo,
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
