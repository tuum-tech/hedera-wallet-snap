import { forwardRef, Ref, useImperativeHandle, useState } from 'react';
import Form from 'react-bootstrap/Form';
import { ExternalAccountParams } from '../../types';

export type GetExternalAccountRef = {
  handleGetAccountParams: () => ExternalAccountParams | undefined;
};

const ExternalAccount = forwardRef(({}, ref: Ref<GetExternalAccountRef>) => {
  const [externalAccount, setExternalAccount] = useState(false);
  const [accountIdOrEvmAddress, setAccountIdOrEvmAddress] = useState('');

  useImperativeHandle(ref, () => ({
    handleGetAccountParams() {
      let params;
      if (externalAccount) {
        params = {
          externalAccount: {
            accountIdOrEvmAddress,
          },
        };
      }
      return params;
    },
  }));

  return (
    <div>
      <Form>
        <Form.Check
          type="checkbox"
          id="external-account-checkbox"
          label="External Account"
          onChange={(e) => {
            setExternalAccount(e.target.checked);
          }}
        />
        {externalAccount && (
          <>
            <Form.Label>
              Enter your Account Id or EVM address to connect to
            </Form.Label>
            <Form.Control
              size="lg"
              type="text"
              placeholder="Account Id or EVM address"
              style={{ marginBottom: 8 }}
              onChange={(e) => setAccountIdOrEvmAddress(e.target.value)}
            />
          </>
        )}
      </Form>
    </div>
  );
});

export default ExternalAccount;
