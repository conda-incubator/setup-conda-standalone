import * as fs from 'fs/promises';
import * as path from 'path';
import { type Options } from '../options';
import { getDownloadUrlFromApi } from './index';

const mockedFetch = vi.spyOn(global, 'fetch');

beforeAll(() => {
  mockedFetch.mockImplementation(async (input: string | URL | Request) => {
    const url =
      input instanceof URL
        ? input.href
        : input instanceof Request
          ? input.url
          : input;
    const channel = url.split('/').at(-3)!;
    const filePath = path.join(
      __dirname,
      '__fixtures__',
      channel,
      'files.json',
    );
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      return new Response(data, { status: 200 });
    } catch {
      return new Response(null, { status: 404 });
    }
  });
});

describe('getDownloadUrlFromApi', () => {
  it('Returns the latest version', async () => {
    const opts = {
      buildString: '',
      channel: 'main',
      condaStandaloneVersion: 'latest',
      platform: 'linux-64',
    } as Options;
    const downloadUrl = await getDownloadUrlFromApi(opts);
    expect(downloadUrl).toBe(
      'https://repo.anaconda.com/pkgs/main/linux-64/conda-standalone-25.11.0-h241fc32_single_1.tar.bz2',
    );
  });

  it('Returns the latest version by default', async () => {
    const opts = {
      buildString: '',
      channel: 'main',
      platform: 'linux-64',
    } as Options;
    const downloadUrl = await getDownloadUrlFromApi(opts);
    expect(downloadUrl).toBe(
      'https://repo.anaconda.com/pkgs/main/linux-64/conda-standalone-25.11.0-h241fc32_single_1.tar.bz2',
    );
  });

  it('Returns the latest version by with undefined builds', async () => {
    const opts = { channel: 'main', platform: 'linux-64' } as Options;
    const downloadUrl = await getDownloadUrlFromApi(opts);
    expect(downloadUrl).toBe(
      'https://repo.anaconda.com/pkgs/main/linux-64/conda-standalone-25.11.0-h241fc32_single_1.tar.bz2',
    );
  });

  it('Returns a specific version', async () => {
    const opts = {
      channel: 'main',
      condaStandaloneVersion: '25.9.1',
      platform: 'linux-64',
    } as Options;
    const downloadUrl = await getDownloadUrlFromApi(opts);
    expect(downloadUrl).toBe(
      'https://repo.anaconda.com/pkgs/main/linux-64/conda-standalone-25.9.1-h241fc32_single_1.tar.bz2',
    );
  });

  it('Returns a specific build', async () => {
    const opts = {
      buildString: '*onedir*',
      channel: 'main',
      platform: 'linux-64',
    } as Options;
    const downloadUrl = await getDownloadUrlFromApi(opts);
    expect(downloadUrl).toBe(
      'https://repo.anaconda.com/pkgs/main/linux-64/conda-standalone-25.11.0-h26a4b9f_onedir_1.tar.bz2',
    );
  });

  it('Returns the latest build of a different architecture', async () => {
    const opts = { channel: 'main', platform: 'linux-aarch64' } as Options;
    const downloadUrl = await getDownloadUrlFromApi(opts);
    expect(downloadUrl).toBe(
      'https://repo.anaconda.com/pkgs/main/linux-aarch64/conda-standalone-25.11.0-h9687f86_single_1.tar.bz2',
    );
  });

  it('Returns a version from a channel label', async () => {
    const opts = {
      channel: 'conda-canary',
      condaStandaloneVersion: '25.11.1',
      label: 'dev',
      platform: 'linux-64',
    } as Options;
    const downloadUrl = await getDownloadUrlFromApi(opts);
    expect(downloadUrl).toBe(
      'https://conda.anaconda.org/conda-canary/label/dev/linux-64/conda-standalone-25.11.1-gbbef4c5_py313_single_0.conda',
    );
  });

  it('Returns the latest build by date', async () => {
    const opts = {
      channel: 'conda-canary',
      label: 'dev',
      platform: 'linux-64',
    } as Options;
    const downloadUrl = await getDownloadUrlFromApi(opts);
    expect(downloadUrl).toBe(
      'https://conda.anaconda.org/conda-canary/label/dev/linux-64/conda-standalone-26.1.0-g94d6a0b_py313_single_0.conda',
    );
  });

  it('Finds a post-release version', async () => {
    const opts = {
      channel: 'main',
      condaStandaloneVersion: '25.5.1.post1',
      platform: 'linux-64',
    } as Options;
    const downloadUrl = await getDownloadUrlFromApi(opts);
    expect(downloadUrl).toBe(
      'https://repo.anaconda.com/pkgs/main/linux-64/conda-standalone-25.5.1.post1-hd606d0a_single_0.tar.bz2',
    );
  });

  it('Throws an error when no version is found', async () => {
    const opts = {
      channel: 'main',
      condaStandaloneVersion: '0.0.0',
      platform: 'linux-64',
    } as Options;
    await expect(getDownloadUrlFromApi(opts)).rejects.toThrow(
      'suitable conda-standalone release',
    );
  });

  it('Throws an error when no suitable build is found', async () => {
    const opts = {
      buildString: 'abcdef',
      channel: 'main',
      platform: 'linux-64',
    } as Options;
    await expect(getDownloadUrlFromApi(opts)).rejects.toThrow(
      'suitable conda-standalone release',
    );
  });

  it('Throws an error when architecture has no files', async () => {
    const opts = {
      channel: 'conda-canary',
      label: 'dev',
      platform: 'linux-aarch64',
    } as Options;
    await expect(getDownloadUrlFromApi(opts)).rejects.toThrow(
      'suitable conda-standalone release',
    );
  });

  it('Throws an error on invalid API response', async () => {
    const opts = { channel: 'does-not-exist' } as Options;
    await expect(getDownloadUrlFromApi(opts)).rejects.toThrow(
      'Failed to fetch data from',
    );
  });
});
