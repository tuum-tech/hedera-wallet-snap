import {
  AccountBalanceQuery,
  AccountId,
  HbarUnit,
  type Client,
} from '@hashgraph/sdk';

import BigNumber from 'bignumber.js';

/**
 * Retrieve the account balance.
 *
 * @param client - Hedera client.
 */
export async function getAccountBalance(client: Client): Promise<BigNumber> {
  // Create the account balance query
  const query = new AccountBalanceQuery().setAccountId(
    client.operatorAccountId as AccountId,
  );

  // Submit the query to a Hedera network
  const accountBalance = await query.execute(client);

  return accountBalance.hbars.to(HbarUnit.Hbar);
}
