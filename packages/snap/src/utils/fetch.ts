/**
 * Retrieve results using hedera mirror node.
 *
 * @param url - The URL to use to query.
 */
export async function fetchDataFromUrl(url: RequestInfo | URL) {
  const response = await fetch(url);
  return await response.json();
}
