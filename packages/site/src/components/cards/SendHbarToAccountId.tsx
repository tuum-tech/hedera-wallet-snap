import { FC, useContext, useRef, useState } from 'react';
import {
  MetaMaskContext,
  MetamaskActions,
} from '../../contexts/MetamaskContext';
import useModal from '../../hooks/useModal';
import { Account, SimpleTransfer } from '../../types/snap';
import {
  getCurrentMetamaskAccount,
  sendHbarToAccountId,
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

const SendHbarToAccountId: FC<Props> = ({
  setCurrentNetwork,
  setMetamaskAddress,
  setAccountInfo,
}) => {
  const [state, dispatch] = useContext(MetaMaskContext);
  const [loading, setLoading] = useState(false);
  const { showModal } = useModal();

  const externalAccountRef = useRef<GetExternalAccountRef>(null);

  const handleSendHbarToAccountIdClick = async () => {
    setLoading(true);
    try {
      const network = hederaNetworks.get('testnet') as string;
      setCurrentNetwork(network);
      const metamaskAddress = await getCurrentMetamaskAccount();
      setMetamaskAddress(metamaskAddress);

      const externalAccountParams =
        externalAccountRef.current?.handleGetAccountParams();

      // 1 ℏ
      const transfers: SimpleTransfer[] = [
        {
          asset: 'HBAR',
          to: '0.0.633893',
          amount: 0.01,
        } as SimpleTransfer,
      ];
      const memo = '';
      // const maxFee: BigNumber = new BigNumber(1); // Note that this value is in tinybars and if you don't pass it, default is 1 HBAR

      const response: any = await sendHbarToAccountId(
        network,
        transfers,
        memo,
        undefined,
        externalAccountParams,
      );

      const { currentAccount, record } = response;
      setAccountInfo(currentAccount);
      console.log('Record: ', JSON.stringify(record, null, 4));
      showModal({
        title: 'Your transaction record',
        content: JSON.stringify(record),
      });
    } catch (error: any) {
      console.error(error);
      dispatch({ type: MetamaskActions.SetError, payload: error });
    }
    setLoading(false);
  };

  return (
    <Card
      content={{
        title: 'sendHbarToAccountId',
        description: 'Send HBAR to Account ID',
        form: <ExternalAccount ref={externalAccountRef} />,
        button: (
          <SendHelloButton
            buttonText="Send HBAR"
            onClick={handleSendHbarToAccountIdClick}
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

export { SendHbarToAccountId };
