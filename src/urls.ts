import { type UrlObject } from "url";

export type QueryParamValue = string | number | boolean | null | undefined;

type QueryParamsForm = "map" | "object" | "record" | "pairs";

type QueryParamPairs<V extends QueryParamValue = QueryParamValue> = {
  key: string;
  value: V;
}[];

type QueryParams<
  F extends QueryParamsForm = QueryParamsForm,
  V extends QueryParamValue = QueryParamValue,
> = F extends string
  ? {
      readonly map: Map<string, V>;
      readonly object: URLSearchParams;
      readonly record: Record<string, V>;
      readonly pairs: QueryParamPairs<V>;
    }[F]
  : never;

type InferQueryParamsForm<Q extends QueryParams> =
  Q extends Map<string, QueryParamValue>
    ? "map"
    : Q extends URLSearchParams
      ? "object"
      : Q extends QueryParamPairs<QueryParamValue>
        ? "pairs"
        : Q extends Record<string, QueryParamValue>
          ? "record"
          : never;

type InferQueryParamsValue<Q extends QueryParams> =
  Q extends Map<string, infer V extends QueryParamValue>
    ? V
    : Q extends URLSearchParams
      ? string
      : Q extends Record<string, infer V>
        ? V
        : Q extends { key: string; value: infer V }[]
          ? V
          : never;

type QueryParamOptions<F extends QueryParamsForm = QueryParamsForm> = {
  readonly form: F;
};

const getQueryParamForm = <Q extends QueryParams>(params: Q): InferQueryParamsForm<Q> => {
  if (params instanceof Map) {
    return "map" as InferQueryParamsForm<Q>;
  } else if (Array.isArray(params)) {
    return "pairs" as InferQueryParamsForm<Q>;
  } else if (params instanceof URLSearchParams) {
    return "object" as InferQueryParamsForm<Q>;
  } else {
    return "record" as InferQueryParamsForm<Q>;
  }
};

const countCharsInString = (value: string, char: string): number => {
  if (char.length !== 1) {
    throw new Error("The character to count must be a single character.");
  }
  let count = 0;
  for (let i = 0; i < value.length; i++) {
    if (value[i] === char) {
      count = count + 1;
    }
  }
  return count;
};

const searchParamsIterator = function* <Q extends QueryParams>(
  params: Q,
): IterableIterator<[string, InferQueryParamsValue<Q>]> {
  if (params instanceof Map) {
    const d = params as Map<string, InferQueryParamsValue<Q>>;
    for (const [k, v] of d) {
      yield [k, v];
    }
  } else if (Array.isArray(params)) {
    for (const { key, value } of params) {
      yield [key, value];
    }
  } else if (params instanceof URLSearchParams) {
    for (const [k, v] of params.entries()) {
      yield [k, v as InferQueryParamsValue<Q>];
    }
  } else {
    for (const k in params) {
      yield [k, params[k] as InferQueryParamsValue<Q>];
    }
  }
};

type QueryParamsReducer<F extends QueryParamsForm> = <
  Q extends QueryParams<F>,
  V extends QueryParamValue,
>(
  curr: Q,
  k: string,
  v: V,
) => QueryParams<F, InferQueryParamsValue<Q> | V>;

const queryParamsReducers: {
  [key in QueryParamsForm]: QueryParamsReducer<key>;
} = {
  map: <Q extends QueryParams<"map">, V extends QueryParamValue>(curr: Q, k: string, v: V) => {
    const mp = new Map<string, V | InferQueryParamsValue<Q>>();
    for (const [ki, vi] of curr) {
      mp.set(ki, vi as V | InferQueryParamsValue<Q>);
    }
    mp.set(k, v);
    return mp as QueryParams<"map", InferQueryParamsValue<Q> | V>;
  },
  object: <Q extends QueryParams<"object">, V extends QueryParamValue>(
    curr: Q,
    k: string,
    v: V,
  ) => {
    const params = new URLSearchParams();
    for (const [ki, vi] of curr) {
      if (typeof vi !== "string") {
        throw new Error(
          "Error performing deep copy of URLSearchParams: Expected a string value but instead " +
            `received value of type '${typeof vi}'!`,
        );
      }
      params.set(ki, vi);
    }
    if (typeof v === "boolean" || typeof v === "number") {
      params.set(k, String(v));
    } else if (typeof v === "string") {
      params.set(k, v);
    }
    return params;
  },
  record: <Q extends QueryParams<"record">, V extends QueryParamValue>(
    curr: Q,
    k: string,
    v: V,
  ) => ({ ...curr, [k]: v }),
  pairs: <Q extends QueryParams<"pairs">, V extends QueryParamValue>(curr: Q, k: string, v: V) =>
    [...curr, { key: k, value: v }] as QueryParams<"pairs", InferQueryParamsValue<Q> | V>,
};

const getQueryParamsReducer = <F extends QueryParamsForm>(form: F): QueryParamsReducer<F> =>
  queryParamsReducers[form];

const initialQueryParamState: {
  [key in QueryParamsForm]: () => QueryParams<key, QueryParamValue>;
} = {
  map: () => new Map<string, QueryParamValue>(),
  object: () => new URLSearchParams(),
  record: () => ({}),
  pairs: () => [],
};

const getInitialQueryParamsState = <O extends QueryParamOptions>(
  options: O,
): QueryParams<O["form"], QueryParamValue> => {
  const initializer = initialQueryParamState[options.form];
  return initializer() as QueryParams<O["form"], QueryParamValue>;
};

export const transformQueryParams = <P extends QueryParams, O extends QueryParamOptions>(
  params: P,
  options: O,
): QueryParams<O["form"], InferQueryParamsValue<P>> => {
  const reducer = getQueryParamsReducer<O["form"]>(options.form);
  let state = getInitialQueryParamsState<O>(options) as QueryParams<
    O["form"],
    InferQueryParamsValue<P>
  >;
  for (const [k, v] of searchParamsIterator(params)) {
    state = reducer<typeof state, InferQueryParamsValue<P>>(state, k, v) as QueryParams<
      O["form"],
      InferQueryParamsValue<P>
    >;
  }
  return state;
};

type GetQueryParamOptions = QueryParamOptions & {
  readonly enforceValidUrl?: boolean;
};

type ParsedQueryParams<O extends QueryParamOptions, V extends QueryParamValue> = O extends {
  readonly form: infer F extends QueryParamsForm;
}
  ? QueryParams<F, V>
  : URLSearchParams;

/**
 * Parses the query parameters from the provided path or URL and returns the query parameters in
 * the form that is dictated by the provided options, {@link GetQueryParamOptions}.
 *
 * @param {string} path The path or URL that query parameters should be parsed from.
 * @param {GetQueryParamOptions} options
 *   Options that dictate the form of the query parameters that are returned, and whether or not
 *   the validity of the provided URL should be enforced.
 */
export const parseQueryParams = <O extends GetQueryParamOptions>(
  path: string,
  options: O,
): ParsedQueryParams<O, string> => {
  let searchParams: URLSearchParams;
  if (options.enforceValidUrl === true) {
    // Construction of the URL object will throw if the URL is invalid.
    const url = new URL(path);
    searchParams = url.searchParams;
  } else if (path.includes("?")) {
    if (countCharsInString(path, "?") > 1) {
      searchParams = new URLSearchParams();
    } else {
      searchParams = new URLSearchParams(path.split("?")[1]);
    }
  } else {
    searchParams = new URLSearchParams();
  }
  return (
    options.form ? transformQueryParams(searchParams, options) : searchParams
  ) as ParsedQueryParams<O, string>;
};

type MergedQueryParams<
  Q extends QueryParams,
  Q2 extends QueryParams,
  Qrest extends QueryParams[] = [],
> = Qrest extends (infer Qresti extends QueryParams)[]
  ? QueryParams<
      InferQueryParamsForm<Q>,
      InferQueryParamsValue<Q> | InferQueryParamsValue<Q2> | InferQueryParamsValue<Qresti>
    >
  : QueryParams<InferQueryParamsForm<Q>, InferQueryParamsValue<Q> | InferQueryParamsValue<Q2>>;

export const mergeQueryParams = <
  Q extends QueryParams,
  Q2 extends QueryParams,
  Qrest extends QueryParams[],
>(
  arg0: Q,
  arg1: Q2,
  ...rest: Qrest
): MergedQueryParams<Q, Q2, Qrest> => {
  if (rest.length === 0) {
    const reducer = getQueryParamsReducer<InferQueryParamsForm<Q>>(getQueryParamForm(arg0));
    let state = arg0 as QueryParams<
      InferQueryParamsForm<Q>,
      InferQueryParamsValue<Q> | InferQueryParamsValue<Q2>
    >;
    for (const [k, v] of searchParamsIterator(arg1)) {
      state = reducer<typeof state, InferQueryParamsValue<Q2>>(state, k, v) as QueryParams<
        InferQueryParamsForm<Q>,
        InferQueryParamsValue<Q> | InferQueryParamsValue<Q2>
      >;
    }
    return state as MergedQueryParams<Q, Q2, Qrest>;
  }
  let state = mergeQueryParams(arg0, arg1) as QueryParams<
    InferQueryParamsForm<Q>,
    InferQueryParamsValue<Q> | InferQueryParamsValue<Q2> | InferQueryParamsValue<Qrest[number]>
  >;
  for (const params of rest) {
    state = mergeQueryParams<typeof state, typeof params, []>(state, params) as QueryParams<
      InferQueryParamsForm<Q>,
      InferQueryParamsValue<Q> | InferQueryParamsValue<Q2> | InferQueryParamsValue<Qrest[number]>
    >;
  }
  return state as MergedQueryParams<Q, Q2, Qrest>;
};

type AddQueryParamsToUrlOptions = {
  readonly replaceExisting: boolean;
};

/**
 * Adds the provided query parameters to the provided URL {@link UrlObject} or path, {@link string},
 * either updating/merging with existing query parameters or replacing them entirely, depending on
 * the options, {@link AddQueryParamsToUrlOptions},  provided to the  method.
 *
 * @param {string | UrlObject} url
 *   The URL {@link string} or object, {@link UrlObject}, that the query parameters should either be
 *   merged into or replaced with entirely.
 *
 * @param {QueryParams} query
 *   The query parameters that should be merged into the provided URL {@link UrlObject} or path,
 *   {@link string}, or replace the existing query parameters on the provided URL {@link UrlObject}
 *   or path, {@link string}, entirely.
 *
 * @param {AddQueryParamsToUrlOptions} options
 *   Options that dictate whether or not existing query parameters on the provided URL
 *   {@link UrlObject} or path, {@link string}, should be replaced entirely or merged into.
 *
 * @returns {U}
 *   The URL {@link string} or object, {@link UrlObject} (depending on the type of the first
 *   argument) with the query parameters added.
 */
export const addQueryParamsToUrl = <U extends string | UrlObject>(
  url: U,
  query: QueryParams,
  opts?: AddQueryParamsToUrlOptions,
): U => {
  const u = typeof url === "string" ? url : url.search || "";

  let urlParams =
    opts?.replaceExisting === true
      ? new URLSearchParams()
      : parseQueryParams(u, { form: "object" });
  urlParams = mergeQueryParams(urlParams, query);

  if (urlParams.toString() !== "") {
    if (typeof url === "string") {
      return (url.split("?")[0] + "?" + urlParams.toString()) as U;
    }
    /* TODO: We will need to revisit this, as there are other properties of the URL object that
       might need to be specified. */
    return {
      ...(url as UrlObject),
      query: urlParams.toString(),
      search: urlParams.toString(), // I do not think this is right!
    } as U;
  }
  return url;
};
