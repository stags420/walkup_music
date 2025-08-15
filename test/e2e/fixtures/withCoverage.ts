import { test as base } from '@playwright/test';
import { addCoverageReport } from 'monocart-reporter';

type JsCoverageEntry = {
  url: string;
  scriptId?: string;
  source?: string;
  functions: unknown[];
};

type ChromiumCoveragePage = {
  coverage: {
    startJSCoverage: (opts?: { resetOnNavigation?: boolean }) => Promise<void>;
    startCSSCoverage: (opts?: { resetOnNavigation?: boolean }) => Promise<void>;
    stopJSCoverage: () => Promise<JsCoverageEntry[]>;
    stopCSSCoverage: () => Promise<unknown[]>;
  };
};

const test = base.extend<{ autoCoverage: string }>({
  autoCoverage: [
    // eslint-disable-next-line destructuring/in-params
    async ({ page, browserName }, use) => {
      const isChromium = browserName === 'chromium';
      const flag = String(
        process.env.VITE_ENABLE_COVERAGE || 'false'
      ).toLowerCase();
      const isCoverageEnabled =
        flag === '1' || flag === 'true' || flag === 'yes';
      const shouldCollect = isChromium && isCoverageEnabled;

      if (shouldCollect) {
        const cPage = page as unknown as ChromiumCoveragePage;
        await Promise.all([
          cPage.coverage.startJSCoverage({ resetOnNavigation: false }),
          cPage.coverage.startCSSCoverage({ resetOnNavigation: false }),
        ]);
      }

      await use('autoCoverage');

      if (shouldCollect) {
        const cPage = page as unknown as ChromiumCoveragePage;
        const [jsCoverage, cssCoverage] = await Promise.all([
          cPage.coverage.stopJSCoverage(),
          cPage.coverage.stopCSSCoverage(),
        ]);
        const coverageList = [...jsCoverage, ...cssCoverage];
        await addCoverageReport(coverageList, test.info());
      }
    },
    { scope: 'test', auto: true },
  ],
});

export { test };
export { expect } from '@playwright/test';
