import * as fs from 'fs/promises';
import * as path from 'path';
import * as core from '@actions/core';
import { downloadCondaStandalone, getTempDirectory } from './index';

vi.mock('@actions/core', { spy: true });

const downloadTimeout = 15000;
let globalTempDirectory: string;

const condaStandaloneUrls: Record<string, string> = {
  binary:
    'https://github.com/conda/conda-standalone/releases/download/24.9.2/conda-standalone-24.9.2-Linux-x86_64.exe',
  conda:
    'https://api.anaconda.org/download/conda-canary/conda-standalone/26.1.0/linux-64/conda-standalone-26.1.0-g94d6a0b_py313_single_0.conda',
  tar: 'https://repo.anaconda.com/pkgs/main/linux-64/conda-standalone-25.11.0-h26a4b9f_onedir_1.tar.bz2',
};

beforeAll(async () => {
  // Suppress debug output from downloading and extracting files
  vi.mocked(core.debug).mockImplementation(vi.fn());
  vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  globalTempDirectory = await fs.mkdtemp(`${getTempDirectory()}${path.sep}`);
  process.env.RUNNER_TEMP = globalTempDirectory;
});

afterAll(() => {
  fs.rm(globalTempDirectory, { recursive: true }).catch((err: unknown) => {
    if (err instanceof Error) {
      core.warning(`Could not clean up staging directory: ${err.message}.`);
    } else {
      core.warning(`Unknown exception thrown during clean-up.`);
    }
  });
});

describe('downloadCondaStandalone', () => {
  for (const packageType in condaStandaloneUrls) {
    it(
      `Downloads and extracts conda-standalone in ${packageType} format`,
      async () => {
        const url = condaStandaloneUrls[packageType];
        const dest = path.join(globalTempDirectory!, packageType);
        const location = await downloadCondaStandalone(url, dest);
        await expect(
          fs.access(location, fs.constants.X_OK),
        ).resolves.toBeUndefined();
        const internalLocation = path.join(path.dirname(location), '_internal');
        expect(
          await fs.stat(internalLocation).then(
            (stats) => stats.isDirectory(),
            () => false,
          ),
        ).toBe(packageType === 'tar');
      },
      downloadTimeout,
    );
  }
});
