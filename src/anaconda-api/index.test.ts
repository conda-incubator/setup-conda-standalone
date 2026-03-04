import * as fs from 'fs/promises';
import * as path from 'path';
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
    const downloadUrl = await getDownloadUrlFromApi(
      '',
      'main',
      'latest',
      'linux-64',
    );
    expect(downloadUrl).toBe(
      'https://api.anaconda.org/download/main/conda-standalone/25.11.0/linux-64/conda-standalone-25.11.0-h241fc32_single_1.tar.bz2',
    );
  });

  it('Returns the latest version by default', async () => {
    const downloadUrl = await getDownloadUrlFromApi('', 'main', '', 'linux-64');
    expect(downloadUrl).toBe(
      'https://api.anaconda.org/download/main/conda-standalone/25.11.0/linux-64/conda-standalone-25.11.0-h241fc32_single_1.tar.bz2',
    );
  });

  it('Returns the latest version by with undefined builds', async () => {
    const downloadUrl = await getDownloadUrlFromApi(
      undefined,
      'main',
      '',
      'linux-64',
    );
    expect(downloadUrl).toBe(
      'https://api.anaconda.org/download/main/conda-standalone/25.11.0/linux-64/conda-standalone-25.11.0-h241fc32_single_1.tar.bz2',
    );
  });

  it('Returns a specific version', async () => {
    const downloadUrl = await getDownloadUrlFromApi(
      '',
      'main',
      '25.9.1',
      'linux-64',
    );
    expect(downloadUrl).toBe(
      'https://api.anaconda.org/download/main/conda-standalone/25.9.1/linux-64/conda-standalone-25.9.1-h241fc32_single_1.tar.bz2',
    );
  });

  it('Returns a specific build', async () => {
    const downloadUrl = await getDownloadUrlFromApi(
      '*onedir*',
      'main',
      'latest',
      'linux-64',
    );
    expect(downloadUrl).toBe(
      'https://api.anaconda.org/download/main/conda-standalone/25.11.0/linux-64/conda-standalone-25.11.0-h26a4b9f_onedir_1.tar.bz2',
    );
  });

  it('Returns the latest build of a different architecture', async () => {
    const downloadUrl = await getDownloadUrlFromApi(
      '',
      'main',
      '',
      'linux-aarch64',
    );
    expect(downloadUrl).toBe(
      'https://api.anaconda.org/download/main/conda-standalone/25.11.0/linux-aarch64/conda-standalone-25.11.0-h9687f86_single_1.tar.bz2',
    );
  });

  it('Returns the latest build by date', async () => {
    const downloadUrl = await getDownloadUrlFromApi(
      '',
      'conda-canary',
      '',
      'linux-64',
    );
    expect(downloadUrl).toBe(
      'https://api.anaconda.org/download/conda-canary/conda-standalone/26.1.0/linux-64/conda-standalone-26.1.0-g94d6a0b_py313_single_0.conda',
    );
  });

  it('Finds a post-release version', async () => {
    const downloadUrl = await getDownloadUrlFromApi(
      '',
      'main',
      '25.5.1.post1',
      'linux-64',
    );
    expect(downloadUrl).toBe(
      'https://api.anaconda.org/download/main/conda-standalone/25.5.1.post1/linux-64/conda-standalone-25.5.1.post1-hd606d0a_single_0.tar.bz2',
    );
  });

  it('Throws an error when no version is found', async () => {
    await expect(
      getDownloadUrlFromApi('', 'main', '0.0.0', 'linux-64'),
    ).rejects.toThrow('suitable conda-standalone release');
  });

  it('Throws an error when no suitable build is found', async () => {
    await expect(
      getDownloadUrlFromApi('abcdef', 'conda-canary', '26.1.0', 'linux-64'),
    ).rejects.toThrow('suitable conda-standalone release');
  });

  it('Throws an error when architecture has no files', async () => {
    await expect(
      getDownloadUrlFromApi('', 'conda-canary', '26.1.0', 'linux-aarch64'),
    ).rejects.toThrow('suitable conda-standalone release');
  });

  it('Throws an error on invalid API response', async () => {
    await expect(
      getDownloadUrlFromApi('', 'does-not-exist', '26.1.0', 'linux-64'),
    ).rejects.toThrow('Failed to fetch data from');
  });
});
