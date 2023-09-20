import { useContext, useEffect, useState } from 'react';
import { Col, Container, Row } from 'react-bootstrap';
import { Card, InstallFlaskButton } from '../components/base';
import { ConnectIdentitySnap } from '../components/cards/ConnectIdentitySnap';
import { ReconnectIdentitySnap } from '../components/cards/ReconnectIdentitySnap';
import { SendHelloHessage } from '../components/cards/SendHelloMessage';
import { Todo } from '../components/cards/Todo';
import {
  CardContainer,
  ErrorMessage,
  Heading,
  Notice,
  PageContainer,
  Span,
} from '../config/styles';
import { MetaMaskContext, MetamaskActions } from '../contexts/MetamaskContext';
import { connectSnap, getCurrentNetwork, getSnap } from '../utils';
import { getNetwork } from '../utils/hedera';

export type Account = {
  metamaskAddress: string;
  hederaAccountId: string;
  hederaEvmAddress: string;
  network: string;
};

const Index = () => {
  const [state, dispatch] = useContext(MetaMaskContext);
  const [metamaskAddress, setMetamaskAddress] = useState('');
  const [currentNetwork, setCurrentNetwork] = useState('');
  const [currentChainId, setCurrentChainId] = useState('');
  const [accountInfo, setAccountInfo] = useState<Account>({} as Account);

  useEffect(() => {
    setMetamaskAddress(metamaskAddress);
    setCurrentNetwork(getNetwork(currentChainId));
  }, [metamaskAddress, currentNetwork, currentChainId]);

  const handleConnectClick = async () => {
    try {
      setMetamaskAddress(await connectSnap());
      setCurrentChainId(await getCurrentNetwork());
      const installedSnap = await getSnap();
      console.log('Installed Snap: ', installedSnap);

      dispatch({
        type: MetamaskActions.SetInstalled,
        payload: installedSnap,
      });
      setAccountInfo({} as Account);
    } catch (e) {
      console.error(e);
      dispatch({ type: MetamaskActions.SetError, payload: e });
    }
  };

  return (
    <PageContainer>
      <Heading>
        Welcome to <Span>Hedera Pulse Snap Demo</Span>
      </Heading>
      <Container>
        <Row>
          <Col>
            <dt>Status:</dt>
            <dd>{currentNetwork ? 'Connected' : 'Disconnected'}</dd>
            <dt>Current Network:</dt>
            <dd>{currentNetwork}</dd>
            <dt>Currently Connected Metamask Account: </dt>
            <dd>{metamaskAddress}</dd>
            <dt>Hedera Account ID: </dt>
            <dd>{accountInfo?.hederaAccountId}</dd>
            <dt>Hedera EVM Address: </dt>
            <dd>{accountInfo?.hederaEvmAddress}</dd>
          </Col>
        </Row>
      </Container>
      {state.error && (
        <ErrorMessage>
          <b>An error happened:</b> {state.error.message}
        </ErrorMessage>
      )}
      <CardContainer>
        {!state.isFlask && (
          <Card
            content={{
              title: 'Install',
              description:
                'Snaps is pre-release software only available in MetaMask Flask, a canary distribution for developers with access to upcoming features.',
              button: <InstallFlaskButton />,
            }}
            fullWidth
          />
        )}
        <ConnectIdentitySnap handleConnectClick={handleConnectClick} />
        <ReconnectIdentitySnap handleConnectClick={handleConnectClick} />

        <SendHelloHessage setCurrentChainId={setCurrentChainId} />
        <Todo />
      </CardContainer>
      <Notice>
        <p>
          Please note that this demo site only serves as an example of how an
          app would interact with <b>Hedera Pulse Snap</b> and you should do
          your own diligence before integrating it into production grade apps.
          Learn more about{' '}
          <a href="https://docs.metamask.io/snaps/" target="_blank">
            Metamask Snaps
          </a>
          .
        </p>
      </Notice>
    </PageContainer>
  );
};

export default Index;
