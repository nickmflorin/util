export type QueryParamValue = string | number | boolean | null | undefined;

export type QueryParamsForm = "map" | "object" | "record" | "pairs" | "string";

export type QueryParamPairs<
  V extends QueryParamValue = QueryParamValue,
  K extends string = string,
> = {
  key: K;
  value: V;
}[];

export type QueryParams<
  F extends QueryParamsForm = QueryParamsForm,
  V extends QueryParamValue = QueryParamValue,
  K extends string = string,
> = F extends string
  ? {
      readonly map: Map<K, V>;
      readonly object: URLSearchParams;
      readonly record: Record<K, V>;
      readonly pairs: QueryParamPairs<V, K>;
      readonly string: string;
    }[F]
  : never;

export type PartialQueryParams<
  F extends QueryParamsForm = QueryParamsForm,
  V extends QueryParamValue = QueryParamValue,
  K extends string = string,
> = F extends string
  ? {
      readonly map: Map<string, V>;
      readonly object: URLSearchParams;
      readonly record: Partial<Record<K, V>>;
      readonly pairs: QueryParamPairs<V, K>;
      readonly string: string;
    }[F]
  : never;

export type InferQueryParamsForm<Q extends QueryParams> = Q extends Map<string, QueryParamValue>
  ? "map"
  : Q extends URLSearchParams
    ? "object"
    : Q extends QueryParamPairs<QueryParamValue>
      ? "pairs"
      : Q extends Record<string, QueryParamValue>
        ? "record"
        : Q extends string
          ? "string"
          : never;

export type OptionsForm<O extends QueryParamOptions> = O extends {
  form: infer F extends QueryParamsForm;
}
  ? F
  : "object";

export const getOptionsForm = <O extends QueryParamOptions>(options: O): OptionsForm<O> =>
  (options.form || "object") as OptionsForm<O>;

export type InferQueryParamsValue<Q extends QueryParams> = Q extends Map<
  string,
  infer V extends QueryParamValue
>
  ? V
  : Q extends URLSearchParams
    ? string
    : Q extends Record<string, infer V>
      ? V
      : Q extends { key: string; value: infer V }[]
        ? V
        : Q extends string
          ? string
          : never;

export type QueryParamOptions<F extends QueryParamsForm = QueryParamsForm> = {
  readonly form?: F;
};
