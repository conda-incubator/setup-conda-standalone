/**
 * Represents the `attrs` property of the file metadata.
 */
interface IPackageAttrs {
  arch: string;
  build: string;
  build_number: number;
  constraints: string[];
  depends: string[];
  has_prefix: boolean;
  license: string;
  license_family: string;
  md5: string;
  name: string;
  operatingsystem: string;
  platform: string;
  sha256: string;
  size: number;
  subdir: string;
  target_triplet: string;
  timestamp: number;
  version: string;
  source_url: string;
  track_features?: string;
}

/**
 * Represents the metadata of a file obtained from the Anaconda API.
 */
export interface IPackageData {
  attrs: IPackageAttrs;
  basename: string;
  description?: string;
  dependencies: string[];
  distribution_type: string;
  download_url: string;
  full_name: string;
  labels?: string[];
  md5: string;
  ndownloads: number;
  owner: string;
  sha256: string;
  size: number;
  type: string;
  version: string;
}

/**
 * Represent the metadata of a file obtained from the Anaconda API with
 * parsed version information.
 */
export type ParsedRelease = IPackageData & {
  parsedVersion: number[];
  postRelease: number;
};
