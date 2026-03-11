import * as core from '@actions/core';
import * as z from 'zod';
import { condaPlatforms } from '../constants';

/**
 * Converts camel case to kebab case to convert from ZOD schema keys
 * to GitHub Action inputs.
 * @param input - The camel-cased input.
 * @returns The converted strig in kebab case.
 */
const camelToKebab = (input: string): string => {
  return input.replace(/[A-Z]/g, (match: string) => `-${match.toLowerCase()}`);
};

/**
 * Obtains the value of the GitHub Action input.
 *
 * @remarks
 * GitHub Actions sets undefined values to empty strings.
 * This function sets it to undefined to be more consistent with TypeScript conventions.
 *
 * @param key - The GitHub Action input key.
 * @returns The value of the input, or undefined if not set.
 */
const getInputOrUndefined = (key: string): string | undefined => {
  const value = core.getInput(key);
  if (value === '') {
    return undefined;
  }
  return value;
};

export const inputsBaseSchema = z.object({
  buildString: z.string().optional(),
  channel: z.string().optional(),
  condaStandaloneVersion: z
    .union([
      z.literal('latest'),
      z
        .string()
        .regex(
          /^\d+\.\d+\.\d+(\.post\d+)?$/,
          'version must either be `latest` or a version matching `1.2.3` or `1.2.3.post4`.',
        ),
    ])
    .optional(),
  destinationDirectory: z.string('destination-directory cannot be empty.'),
  downloadUrl: z.string().optional(),
  platform: z
    .enum(Object.values(condaPlatforms) as [string, ...string[]])
    .optional(),
  setEnv: z.union([z.literal('true'), z.literal('false')]).optional(),
});

const inputsSchema = inputsBaseSchema.refine(
  (data) => data.downloadUrl ?? data.channel,
  {
    message: 'Must specify either download-url or channel.',
  },
);

type Inputs = z.infer<typeof inputsSchema>;

/**
 * Reads inputs from the GitHub Action and performs validation.
 * @returns An object representing the input parameters of the GitHub Action.
 */
export const parseInputs = (): Inputs => {
  const keys = inputsBaseSchema.shape;
  const rawInputs: Record<string, string | undefined> = {};
  for (const key in keys) {
    const ghaKey = camelToKebab(key);
    rawInputs[key] = getInputOrUndefined(ghaKey);
  }
  const parsedInput = inputsSchema.safeParse(rawInputs);
  if (!parsedInput.success) {
    for (const error of parsedInput.error.issues) {
      if (error.path.length > 0) {
        const key = camelToKebab(error.path.join('.'));
        core.error(`Invalid value for ${key}: ${error.message}`);
      } else {
        core.error(error.message);
      }
    }
    throw new Error('Schema validation failed');
  }
  return parsedInput.data;
};
