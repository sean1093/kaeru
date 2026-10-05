import { createHash } from 'node:crypto';
import { cpSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { extname, join, normalize } from 'node:path';

/**
 * A static server that can be switched from one build to another while a browser is
 * watching, so a deploy can be tested rather than assumed.
 *
 * `UpdatePrompt` has shipped since M0 and nothing exercised it: this is the path a corrected
 * tax rule travels to a phone, and the path a wrong one persists on (QA risk R06). Testing
 * it needs two genuinely different builds served from one origin, which `vite preview`
 * cannot do.
 */

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.map': 'application/json; charset=utf-8',
};

export interface DeployServer {
  readonly origin: string;
  /** Serve a different directory from the same origin, as a real redeploy would. */
  serve(root: string): void;
  close(): Promise<void>;
}

/**
 * Serves `root` under `/kaeru/`, the base path the build is compiled for. Every navigation
 * falls back to `index.html`, matching the worker's `navigateFallback`.
 */
export async function startDeployServer(root: string, basePath = '/kaeru/'): Promise<DeployServer> {
  let current = root;

  const server: Server = createServer((request, response) => {
    const url = new URL(request.url ?? '/', 'http://localhost');
    const relative = url.pathname.startsWith(basePath)
      ? url.pathname.slice(basePath.length)
      : url.pathname.replace(/^\//, '');
    // `normalize` plus the prefix check keeps `..` from escaping the build directory.
    const candidate = normalize(join(current, relative === '' ? 'index.html' : relative));

    let body: Buffer;
    let path = candidate;
    try {
      if (!candidate.startsWith(normalize(current))) throw new Error('outside the build');
      body = readFileSync(candidate);
    } catch {
      try {
        path = join(current, 'index.html');
        body = readFileSync(path);
      } catch {
        response.writeHead(404).end('not found');
        return;
      }
    }

    response.writeHead(200, {
      'Content-Type': TYPES[extname(path)] ?? 'application/octet-stream',
      // The worker must see a fresh sw.js on every check, or an update is invisible.
      'Cache-Control': 'no-cache',
    });
    response.end(body);
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (address === null || typeof address === 'string') throw new Error('server has no port');

  return {
    origin: `http://127.0.0.1:${address.port}`,
    serve(next) {
      current = next;
    },
    async close() {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    },
  };
}

/**
 * Make a second build out of a copy of the first.
 *
 * A real redeploy differs in its assets *and* in `sw.js`, and only the second is what makes
 * a browser notice: the update check is a byte comparison of the worker script. So the copy
 * changes `index.html`, then rewrites that file's revision inside the precache manifest —
 * which both changes `sw.js` and makes the new worker actually fetch the new document,
 * rather than serving the old one out of the carried-over cache.
 */
export function deriveNextBuild(from: string, to: string, marker: string): void {
  cpSync(from, to, { recursive: true });

  const indexPath = join(to, 'index.html');
  const index = readFileSync(indexPath, 'utf8').replace(
    '<div id="app">',
    `<div id="app" data-build="${marker}">`,
  );
  writeFileSync(indexPath, index);

  const swPath = join(to, 'sw.js');
  const revision = createHash('md5').update(index).digest('hex');
  const sw = readFileSync(swPath, 'utf8').replace(
    /("|')(?:\.\/)?index\.html\1,\s*revision:\s*("|')[^"']*\2/,
    `"index.html",revision:"${revision}"`,
  );
  if (sw === readFileSync(swPath, 'utf8')) {
    throw new Error(
      'Could not rewrite the index.html revision in sw.js; the manifest shape moved.',
    );
  }
  writeFileSync(swPath, sw);
}
