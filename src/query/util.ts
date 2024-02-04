import {
  type InferQueryParamsForm,
  type InferQueryParamsValue,
  type QueryParams,
  type QueryParamValue,
  type QueryParamsForm,
  type QueryParamOptions,
  type OptionsForm,
} from "./types";

export const getQueryParamForm = <Q extends QueryParams>(params: Q): InferQueryParamsForm<Q> => {
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

export const countCharsInString = (value: string, char: string): number => {
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

export const searchParamsIterator = function* <Q extends QueryParams>(
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
  } else if (typeof params === "string") {
    if (params.includes("?")) {
      if (countCharsInString(params, "?") > 1) {
        return searchParamsIterator(new URLSearchParams());
      }
      return searchParamsIterator(new URLSearchParams(params.split("?")[1]));
    }
    return searchParamsIterator(new URLSearchParams());
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

type QueryParamReducers = {
  [key in QueryParamsForm]: QueryParamsReducer<key>;
};

const queryParamsReducers: QueryParamReducers = {
  map: <Q extends QueryParams<"map">, V extends QueryParamValue>(curr: Q, k: string, v: V) => {
    const mp = new Map<string, V | InferQueryParamsValue<Q>>();
    for (const [ki, vi] of curr) {
      mp.set(ki, vi as V | InferQueryParamsValue<Q>);
    }
    mp.set(k, v);
    return mp as QueryParams<"map", InferQueryParamsValue<Q> | V>;
  },
  string<Q extends QueryParams<"string">, V extends QueryParamValue>(
    this: QueryParamReducers,
    curr: Q,
    k: string,
    v: V,
  ) {
    const params = this.object(new URLSearchParams(curr), k, v);
    return params.toString();
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

export const getQueryParamsReducer = <F extends QueryParamsForm>(form: F): QueryParamsReducer<F> =>
  queryParamsReducers[form];

const initialQueryParamState: {
  [key in QueryParamsForm]: () => QueryParams<key, QueryParamValue>;
} = {
  map: () => new Map<string, QueryParamValue>(),
  object: () => new URLSearchParams(),
  record: () => ({}),
  pairs: () => [],
  string: () => "",
};

export const getInitialQueryParamsState = <O extends QueryParamOptions>(
  options: O,
): QueryParams<OptionsForm<O>, QueryParamValue> => {
  const initializer = initialQueryParamState[options.form || "object"];
  return initializer() as QueryParams<OptionsForm<O>, QueryParamValue>;
};
