import type { Options } from '../options';
import type { IPackageData, ParsedRelease } from './types';

/**
 * Downloads the list of files from the Anaconda API endpoint.
 * @param channel - The channel to download from.
 * @returns The parsed response in JSON format.
 *
 * @throws
 * When the request to the API results in an error.
 */
const getReleasesFromChannel = async (
  channel: string,
): Promise<IPackageData[]> => {
  const releasesUrl = `https://api.anaconda.org/package/${channel}/conda-standalone/files`;
  const response = await fetch(releasesUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch data from ${releasesUrl}.`);
  }
  return response.json() as Promise<IPackageData[]>;
};

/**
 * Returns a pattern matcher used for filtering build strings.
 * It supports wildcards and safely escapes other regex constructs.
 * @param pattern - The pattern to match the build string with.
 * @returns - The pattern match function.
 */
const buildStringMatcher = (
  pattern: string | undefined,
): ((buildString: string) => boolean) => {
  if (pattern === undefined || pattern === '') {
    return () => true;
  }
  const regex = new RegExp(
    `^${pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`,
  );
  return (buildString) => regex.test(buildString);
};

/**
 * Comparison function for to sort conda-standalone releases in descending order.
 * @param a - Data for one release, including split version number.
 * @param b - Data for the release to compare to.
 * @returns -1 if a is newer, 1 otherwise
 */
const compareReleases = (a: ParsedRelease, b: ParsedRelease): number => {
  for (let i = 0; i < a.parsedVersion.length; i++) {
    if (a.parsedVersion[i] !== b.parsedVersion[i]) {
      return a.parsedVersion[i] > b.parsedVersion[i] ? -1 : 1;
    }
  }
  if (a.postRelease !== b.postRelease) {
    return a.postRelease > b.postRelease ? -1 : 1;
  }
  if (a.attrs.build_number !== b.attrs.build_number) {
    return a.attrs.build_number > b.attrs.build_number ? -1 : 1;
  }
  // Deprioritize track_features
  if (a.attrs.track_features !== b.attrs.track_features) {
    return a.attrs.track_features ? 1 : -1;
  }
  // The canary channel has many builds with the same build number,
  // so the time stamp can be used to sort the builds.
  return a.attrs.timestamp > b.attrs.timestamp ? -1 : 1;
};

/**
 * Post-processes data from the Anaconda API.
 * @param release - The raw data from the Anaconda API.
 * @returns Post-processed API data.
 */
const parseRelease = (release: IPackageData): ParsedRelease => {
  const splitVersion = release.version.split('.');
  const parsedVersion = splitVersion.slice(0, 3).map((x) => parseInt(x));
  const postRelease =
    splitVersion.length === 4
      ? parseInt(splitVersion.at(-1)!.replace('post', ''))
      : -1;
  return {
    ...release,
    parsedVersion,
    postRelease,
  };
};

/**
 * Obtains the base URL containing the channel.
 * @param channel - The channel to download the package from.
 * @returns The base URL containing the channel..
 */
const getDownloadBaseUrl = (channel: string): string => {
  switch (channel) {
    case 'main': {
      return 'https://repo.anaconda.com/pkgs';
    }
    default: {
      return 'https://conda.anaconda.org';
    }
  }
};

/**
 * Finds the URL of the latest conda-standalone with the constraints set
 * by the input parameters.
 * @param buildString - The build string to filter releases by.
 * @param channel - The channel to search.
 * @param condaStandaloneVersion - The version of conda-standalone to retrieve.
 * @param platform - The platform/subdir to search through.
 * @returns The URL to the conda-standalone binary or archive.
 *
 * @throws
 * When no conda-standalone release corresponds to the search parameters.
 */
export const getDownloadUrlFromApi = async (
  options: Options,
): Promise<string> => {
  const findLatest =
    !options.condaStandaloneVersion ||
    options.condaStandaloneVersion === 'latest';
  const releases = await getReleasesFromChannel(options.channel!);
  const matchesBuildString = buildStringMatcher(options.buildString);
  const filteredReleases: ParsedRelease[] = releases
    .filter((r) => r.attrs.subdir === options.platform)
    .filter((r) => !options.label || r.labels?.includes(options.label))
    .filter((r) => findLatest || r.version === options.condaStandaloneVersion)
    .filter((r) => matchesBuildString(r.attrs.build))
    .map((r) => parseRelease(r));
  if (filteredReleases.length === 0) {
    throw new Error('Could not find suitable conda-standalone release.');
  }
  const condaStandaloneRelease = filteredReleases.sort(compareReleases)[0];
  const downloadBase = getDownloadBaseUrl(options.channel!);
  const channel = options.label
    ? `${options.channel}/label/${options.label}`
    : options.channel;
  return `${downloadBase}/${channel}/${condaStandaloneRelease.basename}`;
};
