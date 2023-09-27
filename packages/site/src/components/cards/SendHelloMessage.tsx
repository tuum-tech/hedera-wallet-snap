import { FC, useContext } from 'react';
import {
  MetaMaskContext,
  MetamaskActions,
} from '../../contexts/MetamaskContext';
import { Account } from '../../types/snap';
import {
  getCurrentMetamaskAccount,
  sendHello,
  shouldDisplayReconnectButton,
} from '../../utils';
import { hederaNetworks } from '../../utils/hedera';
import { Card, SendHelloButton } from '../base';

type Props = {
  setCurrentNetwork: React.Dispatch<React.SetStateAction<string>>;
  setMetamaskAddress: React.Dispatch<React.SetStateAction<string>>;
  setAccountInfo: React.Dispatch<React.SetStateAction<Account>>;
};

const SendHelloHessage: FC<Props> = ({
  setCurrentNetwork,
  setMetamaskAddress,
  setAccountInfo,
}) => {
  const [state, dispatch] = useContext(MetaMaskContext);

  const handleSendHelloClick = async () => {
    try {
      const network = hederaNetworks.get('testnet') as string;
      setCurrentNetwork(network);
      const metamaskAddress = await getCurrentMetamaskAccount();
      console.log('address: ', metamaskAddress);
      setMetamaskAddress(metamaskAddress);

      const response: any = await sendHello(network);
      setAccountInfo(response.currentAccount);
    } catch (e) {
      console.error(e);
      dispatch({ type: MetamaskActions.SetError, payload: e });
    }
  };

  return (
    <Card
      content={{
        title: 'Send Hello message',
        description:
          'Display a custom message within a confirmation screen in MetaMask.',
        button: (
          <SendHelloButton
            buttonText="Send message"
            onClick={handleSendHelloClick}
            disabled={!state.installedSnap}
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

export { SendHelloHessage };
