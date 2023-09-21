import { forwardRef, Ref, useImperativeHandle, useState } from 'react';
import Form from 'react-bootstrap/Form';
import { ExternalAccountParams } from '../../types';

export type GetExternalAccountRef = {
  handleGetAccountParams: () => ExternalAccountParams | undefined;
};

const ExternalAccount = forwardRef(({}, ref: Ref<GetExternalAccountRef>) => {
  const [externalAccount, setExternalAccount] = useState(false);
  const [accountId, setAccountId] = useState('');

  useImperativeHandle(ref, () => ({
    handleGetAccountParams() {
      let params;
      if (externalAccount) {
        params = {
          externalAccount: {
            accountId,
          },
        };
      }
      return params;
    },
  }));

  return (
    <>
      <Form>
        <Form.Check
          type="checkbox"
          id="external-account-checkbox"
          label="External Account"
          onChange={(e) => {
            setExternalAccount(e.target.checked);
          }}
        />
        <Form.Label>Account Id</Form.Label>
        <Form.Control
          size="lg"
          type="text"
          placeholder="Account Id"
          style={{ marginBottom: 8 }}
          onChange={(e) => setAccountId(e.target.value)}
        />
      </Form>
    </>
  );
});

export default ExternalAccount;
