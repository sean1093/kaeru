/**
 * Refuses to run the production smoke against nothing.
 *
 * Two ways a scheduled smoke can be green without having checked anything: the URL is not
 * set, so every test is skipped; or the URL is set but wrong, so the suite errors in a way
 * a `continue-on-error` step swallows. Both are caught here, before a single test runs, with
 * a message that names the URL it could not reach.
 */
export default async function globalSetup(): Promise<void> {
  const url = process.env.KAERU_SMOKE_URL;
  if (!url) {
    throw new Error(
      'KAERU_SMOKE_URL is not set. The production smoke has no target and must not report success.',
    );
  }

  const target = url.endsWith('/') ? url : `${url}/`;
  let response: Response;
  try {
    response = await fetch(target, { redirect: 'follow' });
  } catch (error) {
    throw new Error(
      `KAERU_SMOKE_URL ${target} is unreachable: ${error instanceof Error ? error.message : error}`,
    );
  }
  if (!response.ok) {
    throw new Error(`KAERU_SMOKE_URL ${target} returned HTTP ${response.status}.`);
  }
}
