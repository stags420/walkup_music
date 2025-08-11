import fs from 'node:fs';
import path from 'node:path';
import type { Page, TestInfo } from '@playwright/test';

export async function saveCoverageDump(
  page: Page,
  testInfo: TestInfo
): Promise<void> {
  try {
    // Stop coverage that was started in beforeEach and convert to Istanbul + V8 dumps
    const v8Entries = await (
      page as unknown as {
        coverage: {
          stopJSCoverage: () => Promise<
            Array<{
              url: string;
              scriptId: string;
              source?: string;
              functions: unknown[];
            }>
          >;
        };
      }
    ).coverage.stopJSCoverage();

    if (!v8Entries || v8Entries.length === 0) return;

    const outDir = path.join(process.cwd(), 'test', 'reports', 'coverage', 'dumps');
    fs.mkdirSync(outDir, { recursive: true });

    const titleParts: string[] = Array.isArray(
      (testInfo as unknown as { titlePath: string[] | (() => string[]) })
        .titlePath
    )
      ? (testInfo as unknown as { titlePath: string[] }).titlePath
      : (testInfo as unknown as { titlePath: () => string[] }).titlePath();
    const safeName = titleParts
      .join(' - ')
      .replaceAll(/[^a-z0-9-_]+/gi, '_')
      .toLowerCase();

    // Save native V8 data with normalized URLs for stable grouping
    const normalizedEntries = v8Entries.map((entry) => {
      let url = String(entry.url || '');
      try {
        const u = new URL(url, 'http://localhost');
        url = u.pathname;
      } catch (_error) {
        void _error;
      }
      const idx = url.indexOf('/src/');
      let normalizedUrl = idx === -1 ? url : url.slice(idx);
      // Remove Monocart/Vite display-name suffix like ": App.tsx"
      normalizedUrl = normalizedUrl.replace(/:(?:\s*[^/]+)$/u, '');
      // Drop any residual query/hash
      normalizedUrl = normalizedUrl.replace(/[?#].*$/u, '');
      return { ...entry, url: normalizedUrl };
    });
    const v8File = path.join(outDir, `${safeName}.v8.json`);
    await fs.promises.writeFile(
      v8File,
      JSON.stringify(normalizedEntries),
      'utf8'
    );
  } catch (error) {
    // Best-effort: do not fail tests due to coverage write issues

    console.warn('Failed to save coverage dump:', error);
  }
}
