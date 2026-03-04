import * as fs from 'fs/promises';
import { platform } from 'os';
import * as path from 'path';
import * as core from '@actions/core';
import * as tc from '@actions/tool-cache';

/* v8 ignore start */
const condaBinaryName: string = platform().startsWith('win')
  ? 'conda.exe'
  : 'conda';
/* v8 ignore stop */

/**
 * Returns the location of the temporary directory, prioritizing runner.temp.
 * @remarks
 * Falls back to %TEMP% (Windows) or /tmp for local tests.
 * See also: https://github.com/actions/toolkit/issues/518
 * @returns  The path to the temp directory.
 */
export const getTempDirectory = (): string => {
  return (
    process.env.RUNNER_TEMP ??
    /* istanbul ignore start */
    process.env.TEMP ??
    process.env.TMP ??
    '/tmp'
    /* istanbul ignore end */
  );
};

/**
 * Extracts a conda or .tar.bz2 file and returns the path to conda.exe.
 * @param filePath - The path to the archive file.
 * @param dest - The directory to extract the archive into.
 * @returns The path containing conda.exe
 */
const extractCondaExe = async (
  filePath: string,
  dest: string,
): Promise<string> => {
  if (filePath.endsWith('.conda')) {
    await tc.extractZip(filePath, dest).then((outPath) => {
      const fileName = path.basename(filePath);
      const tarFile = path.join(
        outPath,
        `pkg-${fileName.replace('.conda', '.tar.zst')}`,
      );
      return tc.extractTar(tarFile, dest, '-x');
    });
    return path.join(dest, 'standalone_conda', 'conda.exe');
  } else if (filePath.endsWith('.tar.bz2')) {
    await tc.extractTar(filePath, dest, '-x');
    return path.join(dest, 'standalone_conda', 'conda.exe');
  } else {
    // Assume that this is the conda-standalone binary
    return filePath;
  }
};

/**
 * Copies the conda-standalone binary to its destination
 * @remarks
 * The copying must include the _internal directory for onedir builds.
 * While it seems easier to pass the source and destination directories
 * instead of the binary paths, the binary has no predictable name if
 * downloaded directly.
 * @param sourceBin - The path to the conda-standalone entry point at the source.
 * @param destBin - That path to the conda-standalone binary at the destination.
 */
const copyCondaStandalone = async (
  sourceBin: string,
  destBin: string,
  /* eslint-disable-next-line @typescript-eslint/no-invalid-void-type */
): Promise<void[]> => {
  const sourceDir = path.dirname(sourceBin);
  const destDir = path.dirname(destBin);
  const internalDir = path.join(sourceDir, '_internal');
  const hasInternalDir: boolean = await fs.stat(internalDir).then(
    (stat) => stat.isDirectory(),
    () => false,
  );
  const copyOperations: (() => Promise<void>)[] = [
    () => fs.copyFile(sourceBin, destBin, fs.constants.COPYFILE_EXCL),
  ];
  if (hasInternalDir) {
    copyOperations.push(() =>
      fs.cp(internalDir, path.join(destDir, '_internal'), { recursive: true }),
    );
  }
  return fs
    .mkdir(destDir, { recursive: true })
    .then(() => Promise.all(copyOperations.map((copyOp) => copyOp())));
};

/**
 * Downloads and extracts conda-standalone.
 * @remarks
 * The function uses a temporary staging directory to extract the archive
 * since many files are not needed for conda-standalone.
 * @param url - The URL to the conda-standalone archive or file.
 * @param dest - The directory to copy conda-standalone into.
 * @returns The location of the conda-standalone binary after download.
 */
export const downloadCondaStandalone = async (
  url: string,
  dest: string,
): Promise<string> => {
  const tmpDir = await fs.mkdtemp(`${getTempDirectory()}${path.sep}`);
  const standaloneBin = path.join(dest, condaBinaryName);
  await tc
    .downloadTool(url, path.join(tmpDir, path.basename(url)))
    .then((downloadPath) => extractCondaExe(downloadPath, tmpDir))
    .then((extractedFile) => copyCondaStandalone(extractedFile, standaloneBin))
    .then(() => fs.chmod(standaloneBin, 0o755));
  fs.rm(tmpDir, { recursive: true }).catch(
    /* v8 ignore next */
    (err: unknown) => {
      if (err instanceof Error) {
        core.warning(`Could not clean up download directory: ${err.message}`);
      } else {
        core.warning(
          'Unknown exception thrown during clean-up of download directory.',
        );
      }
    },
  );
  return standaloneBin;
};
