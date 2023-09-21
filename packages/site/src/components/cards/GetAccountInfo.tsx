import { FC, useContext, useRef, useState } from 'react';
import {
  MetaMaskContext,
  MetamaskActions,
} from '../../contexts/MetamaskContext';
import useModal from '../../hooks/useModal';
import { Account } from '../../types/snap';
import {
  getAccountInfo,
  getCurrentMetamaskAccount,
  shouldDisplayReconnectButton,
} from '../../utils';
import { hederaNetworks } from '../../utils/hedera';
import { Card, SendHelloButton } from '../base';
import ExternalAccount, {
  GetExternalAccountRef,
} from '../sections/ExternalAccount';

type Props = {
  setCurrentNetwork: React.Dispatch<React.SetStateAction<string>>;
  setMetamaskAddress: React.Dispatch<React.SetStateAction<string>>;
  setAccountInfo: React.Dispatch<React.SetStateAction<Account>>;
};

const GetAccountInfo: FC<Props> = ({
  setCurrentNetwork,
  setMetamaskAddress,
  setAccountInfo,
}) => {
  const [state, dispatch] = useContext(MetaMaskContext);
  const [loading, setLoading] = useState(false);
  const { showModal } = useModal();

  const externalAccountRef = useRef<GetExternalAccountRef>(null);

  const handleGetAccountInfoClick = async () => {
    setLoading(true);
    try {
      const network = hederaNetworks.get('testnet') as string;
      setCurrentNetwork(network);
      const metamaskAddress = await getCurrentMetamaskAccount();
      setMetamaskAddress(metamaskAddress);

      const externalAccountParams =
        externalAccountRef.current?.handleGetAccountParams();

      const response: any = await getAccountInfo(
        network,
        externalAccountParams,
      );
      setAccountInfo(response.currentAccount);
      const accountInfo = response.accountInfo;
      console.log('accountInfo: ', JSON.stringify(accountInfo, null, 4));
      showModal({
        title: 'Your account info',
        content: JSON.stringify(accountInfo),
      });
    } catch (e) {
      console.error(e);
      dispatch({ type: MetamaskActions.SetError, payload: e });
    }
    setLoading(false);
  };

  return (
    <Card
      content={{
        title: 'getAccountInfo',
        description: 'Get the current account information',
        form: <ExternalAccount ref={externalAccountRef} />,
        button: (
          <SendHelloButton
            buttonText="Get Account Info"
            onClick={handleGetAccountInfoClick}
            disabled={!state.installedSnap}
            loading={loading}
          />
        ),
      }}
      disabled={!state.installedSnap}
      fullWidth={
        state.isFlask &&
        Boolean(state.installedSnap) &&
        !shouldDisplayReconnectButton(state.installedSnap)
      }
    />
  );
};

export { GetAccountInfo };
