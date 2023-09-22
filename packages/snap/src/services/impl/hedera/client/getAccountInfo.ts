import { AccountInfo, AccountInfoQuery, type Client } from '@hashgraph/sdk';

import { HederaAccountInfo } from '../../../hedera';

/**
 * Retrieve the account info.
 *
 * @param client - Hedera client.
 * @param accountId - Hedera Account Id to retrieve account info for.
 */
export async function getAccountInfo(
  client: Client,
  accountId: string,
): Promise<HederaAccountInfo> {
  // Create the account info query
  const query = new AccountInfoQuery().setAccountId(accountId);

  // Sign with client operator private key and submit the query to a Hedera network
  const accountInfo: AccountInfo = await query.execute(client);

  return accountInfo as unknown as HederaAccountInfo;
}
