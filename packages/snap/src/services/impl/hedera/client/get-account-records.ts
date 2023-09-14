import { CryptoTransfer } from '../../../../domain/CryptoTransfer';
import { fetchDataFromUrl } from '../../../../utils/fetch';

/**
 * Retrieve account records.
 *
 */
export async function getAccountRecords(): Promise<
  CryptoTransfer[] | undefined
> {
  // TODO: Change the way we get network info
  const network = 'mainnet';

  const resp = await fetchDataFromUrl(
    `https://v2.api${network}.kabuto.sh/transaction?filter[entityId]=${store.accountId}`,
  )
    .then(({ data }) => data)
    .catch((error: Error) => {
      throw error;
    });

  return resp.data as CryptoTransfer[];
}
