import { exit } from 'process';
import * as core from '@actions/core';
import { getDownloadUrlFromApi } from './anaconda-api';
import { downloadCondaStandalone } from './download';
import { getOptions } from './options';

/**
 * Runs the action and sets outputs and environment variables.
 */
const run = async (): Promise<void> => {
  const options = getOptions();
  const downloadUrl =
    options.downloadUrl ?? (await getDownloadUrlFromApi(options));
  const standaloneBin = await downloadCondaStandalone(
    downloadUrl,
    options.destinationDirectory,
  );
  if (options.setEnv) {
    core.exportVariable('CONDA_EXE', standaloneBin);
  }
  core.setOutput('conda-standalone-path', standaloneBin);
};

run()
  .then(() => exit(0)) // workaround for https://github.com/actions/toolkit/issues/1578
  .catch((err: unknown) => {
    if (core.isDebug()) {
      throw err;
    }
    if (err instanceof Error) {
      core.setFailed(err.message);
      exit(1);
    } else if (typeof err === 'string') {
      core.setFailed(err);
      exit(1);
    }
    throw err;
  });
