import difference from "lodash.difference";

import { humanizeList } from "~/lib/formatters";

import { transformQueryParams } from "./transform-query-params";
import {
  type QueryParams,
  type PartialQueryParams,
  type InferQueryParamsValue,
  type OptionsForm,
  getOptionsForm,
} from "./types";
import { getInitialQueryParamsState, getQueryParamsReducer, searchParamsIterator } from "./util";

type ParseQueryParamOptionsBase = {
  readonly enforceValidUrl?: boolean;
};

type ParseQueryParamKeysOptions = ParseQueryParamOptionsBase & {
  readonly keys: string[];
  readonly strict?: boolean;
  readonly form: "map" | "record" | "pairs";
};

type ParseQueryParamKeylessOptions = ParseQueryParamOptionsBase & {
  readonly keys?: never;
  readonly strict?: never;
  readonly form?: "object" | "map" | "record" | "pairs" | "string";
};

type ParseQueryParamOptions = ParseQueryParamKeylessOptions | ParseQueryParamKeysOptions;

type InferOutput<
  P extends QueryParams,
  O extends ParseQueryParamOptions,
  K extends string,
> = O extends { strict: false }
  ? PartialQueryParams<OptionsForm<O>, InferQueryParamsValue<P>, K>
  : QueryParams<OptionsForm<O>, InferQueryParamsValue<P>, K>;

type ParsedQueryParams<P extends QueryParams, O extends ParseQueryParamOptions> = O extends {
  readonly keys: (infer K extends string)[];
}
  ? InferOutput<P, O, K>
  : InferOutput<P, O, string>;

/**
 * Parses the query parameters from the provided path, query string, URL, {@link URLSearchParams}
 * object, map of query parameters {@link Map}, or record-type, {@link Record<string, string>},
 * returning the query parameters in a form that is dictated by the 'form' option (which will
 * by default return the query parameters as a {@link URLSearchParams} object).
 *
 * @param {P} base
 *   The path, query string, URL, {@link URLSearchParams} object, map of query parameters
 *   {@link Map}, or query parameters record-type, {@link Record<string, string>}, that contains
 *   the parameters that are being parsed.
 *
 * @param {ParseQueryParamOptions} options
 *   Options that dictate the manner in which the query parameters are parsed.
 *
 *   @property {string[]} keys
 *     The specific query parameters that should be parsed from the provided base.  This is useful
 *     in cases where only a subset of the query parameters are needed, and can be used to enforce
 *     that those query parameters are in fact present in the provided base.
 *
 *     If the 'strict' option is not provided explicitly as 'false', and any of the provided 'keys'
 *     are not present as query parameters in the provided base, an error will be thrown.
 *
 *     This option is optional.
 *
 *   @property {boolean} strict
 *     Determines whether or not an error should be thrown if any of the provided 'keys' are not
 *     in the set of query parameters defined by the provided base.
 *
 *     This prop is optional, and only applicable if the 'keys' option is provided.
 *
 *     Default: true (if the 'keys' option is provided)
 *
 *   @property {QueryParamsForm} form
 *     The form in which the query parameters should be returned.  This can be one of the following:
 *     1. "map": Will return as a {@link Map} instance.
 *     2. "object": Will return as a {@link URLSearchParams} instance.
 *     3. "record": Will return as a record-type, {@link Record<string, string>}.
 *     4. "pairs": Will return as an array of key-value pairs, {@link QueryParamPairs}.
 *     5. "string": Will return as a query string.
 */
export const parseQueryParams = <P extends QueryParams, O extends ParseQueryParamOptions>(
  base: P,
  options: O,
): ParsedQueryParams<P, O> => {
  const reducer = getQueryParamsReducer(getOptionsForm(options));
  let state = getInitialQueryParamsState<O>(options) as QueryParams<
    OptionsForm<O>,
    InferQueryParamsValue<P>
  >;
  const presentKeys: string[] = [];
  for (const [k, v] of searchParamsIterator(base)) {
    if (options.keys === undefined || options.keys.includes(k)) {
      state = reducer<typeof state, InferQueryParamsValue<P>>(state, k, v) as QueryParams<
        OptionsForm<O>,
        InferQueryParamsValue<P>
      >;
      presentKeys.push(k);
    }
  }
  if (
    options.keys !== undefined &&
    options.strict !== false &&
    presentKeys.length !== options.keys.length
  ) {
    const missingKeys = difference(options.keys, presentKeys);
    const humanized = humanizeList(missingKeys, { conjunction: "and", formatter: v => `'${v}'` });
    throw new Error(
      `The following query parameter(s) were not present in the provided input: ${humanized}`,
    );
  } else if (options.form) {
    return transformQueryParams(state, options) as ParsedQueryParams<P, O>;
  }
  return state as ParsedQueryParams<P, O>;
};
