import { FC, useContext } from 'react';
import {
  MetaMaskContext,
  MetamaskActions,
} from '../../contexts/MetamaskContext';
import {
  getCurrentMetamaskAccount,
  sendHello,
  shouldDisplayReconnectButton,
} from '../../utils';
import { Card, SendHelloButton } from '../base';

type Props = {
  setMetamaskAddress: React.Dispatch<React.SetStateAction<string>>;
};

const SendHelloHessage: FC<Props> = ({ setMetamaskAddress }) => {
  const [state, dispatch] = useContext(MetaMaskContext);

  const handleSendHelloClick = async () => {
    try {
      const metamaskAddress = await getCurrentMetamaskAccount();
      setMetamaskAddress(metamaskAddress);

      const network = 'mainnet';
      await sendHello(network);
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
