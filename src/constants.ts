/**
 * A map that converts NodeJS architecture designations
 * to conda channel subdirectories (platforms)
 */
export const condaPlatforms: Record<string, string> = {
  'darwin-arm64': 'osx-arm64',
  'darwin-x64': 'osx-64',
  'linux-arm64': 'linux-aarch64',
  'linux-ppc64': 'linux-ppc64le',
  'linux-s390x': 'linux-s390x',
  'linux-x64': 'linux-64',
  'win32-arm64': 'win-arm64',
  'win32-x64': 'win-64',
} as const;
