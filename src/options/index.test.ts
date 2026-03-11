import * as os from 'os';
import { condaPlatforms } from '../constants';
import { getCondaArch, getOptions } from './index';

const platform = `${os.platform()}-${os.arch()}`;
const condaPlatform = condaPlatforms[platform];
const unsupportedPlatform = !condaPlatform;
const oldEnv = process.env;

beforeEach(() => {
  process.env = oldEnv;
});

describe('getCondaArch', () => {
  it('Detects the correct conda platform value', () => {
    expect(getCondaArch('darwin', 'x64')).toBe('osx-64');
  });

  it('Throw an error on an unknown platform', () => {
    expect(() => getCondaArch('linux', 'x32')).toThrow('Unsupported platform');
  });
});

describe('getOptions', () => {
  it('Returns options with correct default values', ({ skip }) => {
    skip(unsupportedPlatform);
    const inputRaw: Record<string, string> = {
      INPUT_CHANNEL: 'conda-canary',
      'INPUT_DESTINATION-DIRECTORY': '/home/user/conda_standalone',
    };
    process.env = { ...inputRaw, ...oldEnv };
    let options = getOptions();
    expect(options.channel).toBe('conda-canary');
    expect(options.condaStandaloneVersion).toBe('latest');
    expect(options.destinationDirectory).toBe('/home/user/conda_standalone');
    expect(options.downloadUrl).toBe(undefined);
    expect(options.setEnv).toBe(true);
    expect(options.platform).toBe(condaPlatform);
    inputRaw['INPUT_DOWNLOAD-URL'] =
      'https://example.com/conda-standalone.conda';
    delete inputRaw.INPUT_CHANNEL;
    process.env = { ...inputRaw, ...oldEnv };
    options = getOptions();
    expect(options.channel).toBe(undefined);
  });

  it('Returns options with set values passed through', () => {
    const inputRaw: Record<string, string> = {
      INPUT_BUILD_STRING: 'abcdefg',
      INPUT_CHANNEL: 'conda-canary',
      'INPUT_CONDA-STANDALONE-VERSION': '1.2.3',
      'INPUT_DESTINATION-DIRECTORY': '/home/user/conda_standalone',
      'INPUT_DOWNLOAD-URL': 'https://example.com/conda-standalone.conda',
      INPUT_PLATFORM: 'linux-aarch64',
      'INPUT_SET-ENV': 'false',
    };
    process.env = { ...inputRaw, ...oldEnv };
    const options = getOptions();
    expect(options.channel).toBe('conda-canary');
    expect(options.condaStandaloneVersion).toBe('1.2.3');
    expect(options.destinationDirectory).toBe('/home/user/conda_standalone');
    expect(options.downloadUrl).toBe(
      'https://example.com/conda-standalone.conda',
    );
    expect(options.setEnv).toBe(false);
    expect(options.platform).toBe('linux-aarch64');
  });

  it('Correctly parses a label from a channel', () => {
    const inputRaw: Record<string, string> = {
      INPUT_CHANNEL: 'conda-canary/label/dev',
      'INPUT_DESTINATION-DIRECTORY': '/home/user/conda_standalone',
    };
    process.env = { ...inputRaw, ...oldEnv };
    const options = getOptions();
    expect(options.channel).toBe('conda-canary');
    expect(options.label).toBe('dev');
  });
});
