/* eslint-env node */
import fs from 'node:fs';
import path from 'node:path';
import MCR from 'monocart-coverage-reports';

// Gather per-test V8 dumps and create reports
function findJsonFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs
    .readdirSync(directory)
    .filter((f) => f.endsWith('.json'))
    .map((f) => path.join(directory, f));
}

function buildSourceIndex(rootDirectory) {
  const sourceDirectory = path.join(rootDirectory, 'src');
  const stack = [sourceDirectory];
  const index = new Map(); // basename -> Set of '/src/...'
  while (stack.length > 0) {
    const directory = stack.pop();
    if (!directory || !fs.existsSync(directory)) continue;
    const entries = fs.readdirSync(directory, { withFileTypes: true });
    for (const ent of entries) {
      const p = path.join(directory, ent.name);
      if (ent.isDirectory()) {
        stack.push(p);
      } else {
        const base = ent.name;
        const relative = p.slice(sourceDirectory.length);
        const normalized = '/src' + relative.replaceAll('\\', '/');
        const set = index.get(base) ?? new Set();
        set.add(normalized);
        index.set(base, set);
      }
    }
  }
  return index;
}

async function main() {
  if (!globalThis.process?.env?.VITE_E2E_COVERAGE) {
    globalThis.console.log(
      'E2E coverage not enabled (VITE_E2E_COVERAGE not set). Skipping report generation.'
    );
    return;
  }
  const cwd = globalThis.process.cwd();
  const dumpsDirectory = path.join(cwd, 'test', 'reports', 'coverage', 'dumps');
  const reportDirectory = path.join(cwd, 'test', 'reports', 'coverage', 'e2e');
  fs.mkdirSync(reportDirectory, { recursive: true });

  const files = findJsonFiles(dumpsDirectory);
  if (files.length === 0) {
    const info = path.join(reportDirectory, 'README.txt');
    fs.writeFileSync(
      info,
      'No E2E coverage dumps found. Ensure tests call saveCoverageDump() and Vite build is instrumented.'
    );
    globalThis.console.log('No coverage dumps found in', dumpsDirectory);
    // Nothing to merge; exit gracefully
    return;
  }

  // Generate a single Monocart report combining all V8 dumps
  const v8Blocks = files
    .filter((p) => p.endsWith('.v8.json'))
    .map((p) => JSON.parse(fs.readFileSync(p, 'utf8')));
  if (v8Blocks.length === 0) {
    const info = path.join(reportDirectory, 'README.txt');
    fs.writeFileSync(
      info,
      'No V8 dumps found. Ensure Chromium is used and coverage is started.'
    );
    globalThis.console.log('No V8 dumps found in', dumpsDirectory);
    return;
  }

  // Build a basename -> /src/... index for fallback normalization
  const sourceIndex = buildSourceIndex(cwd);

  // Flatten V8 blocks (filtering and path normalization handled by reporter options below)
  const combined = v8Blocks.flat();

  const mcr = MCR({
    // ensure relative path resolution uses the project root
    baseDir: cwd,
    // generate a standalone native V8 coverage report
    outputDir: path.join(
      cwd,
      'test',
      'reports',
      'coverage',
      'e2e',
      'v8-report'
    ),
    // Only V8-based reports (no Istanbul)
    reports: ['v8', 'v8-json', 'console-summary'],
    // Filter only application sources
    entryFilter: (entry) => {
      const url = String((entry && entry.url) || '');
      if (!url) return false;
      if (
        url.includes('node_modules') ||
        url.includes('/@vite/') ||
        url.includes('vite/dist')
      )
        return false;
      return url.includes('/src/');
    },
    // restore full source paths for JS/TS sources when sourcemaps only provide basenames
    // this is applied in multiple phases (raw V8 entries and sourcemap-unpacked sources)
    sourcePath: (filePath, info) => {
      let sp = String(filePath || '').replaceAll('\\\\', '/');
      // keep existing /src paths as-is (strip leading slash to match report expectations)
      if (sp.startsWith('/src/')) return sp.slice(1);
      if (sp.startsWith('src/')) return sp;
      // try to extract /src/... from original source URL if present
      const rawUrl =
        info && typeof info === 'object' ? String(info.url || '') : '';
      if (rawUrl) {
        const match = rawUrl.match(/\/src\/[^?#]*/);
        if (match && match[0]) return match[0].replace(/^\//, '');
      }
      // if only a filename, try to resolve via the pre-built src index
      const base = path.basename(sp);
      const candidates = sourceIndex.get(base);
      if (candidates && candidates.size === 1) {
        const only = [...candidates][0];
        return only.startsWith('/') ? only.slice(1) : only;
      }
      return sp;
    },
  });
  await mcr.add(combined);
  await mcr.generate();

  globalThis.console.log(
    'V8 coverage written to',
    path.join(cwd, 'test', 'reports', 'coverage', 'e2e', 'v8-report')
  );

  // Create a lightweight index to unify access
  const indexHtmlPath = path.join(cwd, 'test', 'reports', 'index.html');
  fs.mkdirSync(path.dirname(indexHtmlPath), { recursive: true });
  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Test Reports</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font-family: -apple-system, system-ui, Segoe UI, Roboto, Helvetica, Arial, sans-serif; margin: 2rem; }
      a { display: block; margin: 0.5rem 0; font-size: 1.1rem; }
      code { background: #f5f5f5; padding: 0.1rem 0.3rem; border-radius: 4px; }
    </style>
  </head>
  <body>
    <h1>Test Reports</h1>
    <ol>
      <li><a href="http://localhost:8090/test/reports/monocart/index.html">Open Test Report (Monocart)</a></li>
      <li><a href="./coverage/e2e/v8-report/index.html">Open Coverage Report (V8)</a></li>
    </ol>
    <p><small>Tip: run <code>npm run report:serve</code> to launch the local server if links fail to load.</small></p>
  </body>
 </html>`;
  fs.writeFileSync(indexHtmlPath, html, 'utf8');
}

// eslint-disable-next-line unicorn/prefer-top-level-await
main().catch((error) => {
  globalThis.console.error('Coverage report generation failed:', error);
  // Intentionally do not throw to avoid failing CI if coverage is optional
});
