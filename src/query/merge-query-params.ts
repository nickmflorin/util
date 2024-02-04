import { type QueryParams, type InferQueryParamsForm, type InferQueryParamsValue } from "./types";
import { getQueryParamForm, getQueryParamsReducer, searchParamsIterator } from "./util";

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
