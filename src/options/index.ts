import * as os from 'os';
import { condaPlatforms } from '../constants';
import { parseInputs } from './inputs';

export type Options = Readonly<{
  buildString?: string;
  channel?: string;
  condaStandaloneVersion: string;
  destinationDirectory: string;
  downloadUrl?: string;
  setEnv: boolean;
  label?: string;
  platform: string;
}>;

/**
 * Converts NodeJS platform information into a conda platform/subdir string.
 * @param platform - The name of the platform (Linux, macOS, Windows)
 * @param arch - The name of the CPU architecture.
 * @returns The name of the platform as a conda subdir.
 *
 * @throws
 * When there is no subdir for the requiested architecture.
 */
export const getCondaArch = (
  platform: string = os.platform(),
  arch: string = os.arch(),
): string => {
  const systemPlatform = `${platform}-${arch}`;
  const condaArch = condaPlatforms[systemPlatform];
  if (!condaArch) {
    throw new Error(`Unsupported platform: ${systemPlatform}`);
  }
  return condaArch;
};

/**
 * Parses validated inputs from the GitHub Action.
 *
 * @remarks
 * This function assigns default values
 *
 * @param inputs - The validated GitHub Action inputs.
 * @returns An object containing parsed inputs.
 */
export const getOptions = (): Options => {
  const inputs = parseInputs();

  const condaStandaloneVersion = inputs.condaStandaloneVersion ?? 'latest';
  const setEnv = inputs.setEnv !== 'false';
  const platform = inputs.platform ?? getCondaArch();
  let channel = inputs.channel;
  let label;
  if (channel) {
    const channelSplit = channel.split('/');
    if (channelSplit.length === 3 && channelSplit[1] === 'label') {
      channel = channelSplit[0];
      label = channelSplit[2];
    }
  }
  return {
    ...inputs,
    channel,
    condaStandaloneVersion,
    label,
    platform,
    setEnv,
  } as Options;
};
