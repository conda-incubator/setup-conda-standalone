import * as fs from 'fs/promises';
import * as path from 'path';
import { error as coreError } from '@actions/core';
import * as yaml from 'js-yaml';
import { inputsBaseSchema, parseInputs } from './inputs';

vi.mock('@actions/core', { spy: true });

let coreErrorOutput = '';
const oldEnv = process.env;

const camelToKebab = (input: string): string => {
  return input.replace(/[A-Z]/g, (match: string) => `-${match.toLowerCase()}`);
};
const kebabToCamel = (input: string): string => {
  return input.replace(/-([a-z])/g, (_, match: string) => match.toUpperCase());
};

interface ActionYaml {
  inputs?: Record<string, unknown>;
}

beforeAll(() => {
  vi.mocked(coreError).mockImplementation((message: string | Error) => {
    coreErrorOutput = message instanceof Error ? message.toString() : message;
  });
});

afterEach(() => {
  process.env = oldEnv;
  coreErrorOutput = '';
});

describe('inputs schema', async () => {
  const actionYamlLocation = path.resolve(__dirname, '../../action.yaml');
  const actionYaml = yaml.load(
    await fs.readFile(actionYamlLocation, 'utf8'),
  ) as ActionYaml;
  const definedInputs = actionYaml.inputs ?? {};

  it('Ensures that the input schema is consistent with action inputs.', () => {
    for (const key in inputsBaseSchema.shape) {
      expect(definedInputs).toHaveProperty(camelToKebab(key));
    }
  });

  it('Ensures that action inputs are consistent with the input schema.', () => {
    for (const key in definedInputs) {
      expect(inputsBaseSchema.shape).toHaveProperty(kebabToCamel(key));
    }
  });
});

describe('parseInputs', () => {
  it('Parses a full set of input parameters', () => {
    const inputRaw: Record<string, string> = {
      INPUT_BUILD_STRING: 'abcdefg',
      INPUT_CHANNEL: 'conda-canary',
      'INPUT_CONDA-STANDALONE-VERSION': 'latest',
      'INPUT_DESTINATION-DIRECTORY': '/home/user/conda_standalone',
      'INPUT_DOWNLOAD-URL': 'https://example.com/conda-standalone.conda',
      INPUT_PLATFORM: 'linux-aarch64',
      'INPUT_SET-ENV': 'false',
    };
    process.env = { ...inputRaw, ...oldEnv };
    const inputs = parseInputs();
    expect(inputs.channel).toBe('conda-canary');
    expect(inputs.condaStandaloneVersion).toBe('latest');
    expect(inputs.destinationDirectory).toBe('/home/user/conda_standalone');
    expect(inputs.downloadUrl).toBe(
      'https://example.com/conda-standalone.conda',
    );
    expect(inputs.setEnv).toBe('false');
    expect(inputs.platform).toBe('linux-aarch64');
  });

  it('Ensures that empty optional inputs are undefined', () => {
    const inputRaw: Record<string, string> = {
      INPUT_CHANNEL: 'conda-canary',
      'INPUT_DESTINATION-DIRECTORY': '/home/user/conda_standalone',
    };
    process.env = { ...inputRaw, ...oldEnv };
    let inputs = parseInputs();
    expect(inputs.channel).toBe('conda-canary');
    expect(inputs.condaStandaloneVersion).toBe(undefined);
    expect(inputs.setEnv).toBe(undefined);
    expect(inputs.destinationDirectory).toBe('/home/user/conda_standalone');
    expect(inputs.downloadUrl).toBe(undefined);
    expect(inputs.platform).toBe(undefined);
    inputRaw['INPUT_DOWNLOAD-URL'] =
      'https://example.com/conda-standalone.conda';
    delete inputRaw.INPUT_CHANNEL;
    process.env = { ...inputRaw, ...oldEnv };
    inputs = parseInputs();
    expect(inputs.channel).toBe(undefined);
  });

  it('Parses a valid conda-standalone version', () => {
    const inputRaw: Record<string, string> = {
      INPUT_CHANNEL: 'conda-canary',
      'INPUT_CONDA-STANDALONE-VERSION': '1.2.3',
      'INPUT_DESTINATION-DIRECTORY': '/home/user/conda_standalone',
    };
    process.env = { ...inputRaw, ...oldEnv };
    const inputs = parseInputs();
    expect(inputs.condaStandaloneVersion).toBe('1.2.3');
  });

  it('Parses a valid conda-standalone post-release version', () => {
    const inputRaw: Record<string, string> = {
      INPUT_CHANNEL: 'conda-canary',
      'INPUT_CONDA-STANDALONE-VERSION': '1.2.3.post4',
      'INPUT_DESTINATION-DIRECTORY': '/home/user/conda_standalone',
    };
    process.env = { ...inputRaw, ...oldEnv };
    const inputs = parseInputs();
    expect(inputs.condaStandaloneVersion).toBe('1.2.3.post4');
  });

  it('Throws an error when the conda-standalone version is invalid', () => {
    const inputRaw: Record<string, string> = {
      INPUT_CHANNEL: 'conda-canary',
      'INPUT_CONDA-STANDALONE-VERSION': '1.2.3.4',
      'INPUT_DESTINATION-DIRECTORY': '/home/user/conda_standalone',
    };
    process.env = { ...inputRaw, ...oldEnv };
    expect(() => parseInputs()).toThrow('Schema validation failed');
    expect(coreErrorOutput).toContain(
      'Invalid value for conda-standalone-version:',
    );
  });

  it('Throws an error when the destination directory is missing', () => {
    const inputRaw: Record<string, string> = {
      INPUT_CHANNEL: 'conda-canary',
      'INPUT_DESTINATION-DIRECTORY': '',
    };
    process.env = { ...inputRaw, ...oldEnv };
    expect(() => parseInputs()).toThrow('Schema validation failed');
    expect(coreErrorOutput).toBe(
      'Invalid value for destination-directory: destination-directory cannot be empty.',
    );
  });

  it('Throws an error when channel and URL are missing', () => {
    const inputRaw: Record<string, string> = {
      'INPUT_DESTINATION-DIRECTORY': '/home/users/conda_standalone',
    };
    process.env = { ...inputRaw, ...oldEnv };
    expect(() => parseInputs()).toThrow('Schema validation failed');
    expect(coreErrorOutput).toBe(
      'Must specify either download-url or channel.',
    );
  });
});
