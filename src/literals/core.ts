import { z } from "zod";

export type LiteralsArray = readonly [string, ...string[]];

export type LiteralsBaseModel<V extends string = string> = {
  readonly value: V;
  readonly accessor?: string;
};

export const LiteralsBaseModelSchema = z.object({
  value: z.string(),
  accessor: z.string().optional(),
});

export const isLiteralModel = <V extends string = string>(
  v: V | LiteralsBaseModel<V>,
): v is LiteralsBaseModel<V> => typeof v !== "string";

export type LiteralsBaseModelArray<V extends string = string> = readonly LiteralsBaseModel<V>[];

export type Literals = LiteralsArray | LiteralsBaseModelArray;

export const literalsAreModelArray = (l: unknown): l is LiteralsBaseModelArray => {
  const schema = z.array(LiteralsBaseModelSchema);
  return schema.safeParse(l).success;
};

export const literalsAreArray = (l: unknown): l is LiteralsArray => {
  const schema = z.array(z.string());
  return schema.safeParse(l).success;
};

export type LiteralsValue<L extends Literals> = L extends LiteralsArray
  ? L[number]
  : L extends LiteralsBaseModelArray
    ? L[number]["value"]
    : never;

export type LiteralsBaseModelArrayValues<L extends LiteralsBaseModelArray> = L extends readonly [
  infer Li extends LiteralsBaseModel,
]
  ? readonly [Li["value"]]
  : L extends readonly [infer Li extends LiteralsBaseModel, ...infer R extends LiteralsBaseModel[]]
    ? readonly [Li["value"], ...LiteralsBaseModelArrayValues<R>]
    : never;

export type LiteralsArrayModels<L extends readonly string[]> = L extends readonly [
  infer Li extends string,
]
  ? readonly [{ value: Li }]
  : L extends readonly [infer Li extends string, ...infer R extends string[]]
    ? readonly [{ value: Li }, ...LiteralsArrayModels<R>]
    : never;

export type LiteralsValues<L extends Literals> = L extends LiteralsArray
  ? L
  : L extends LiteralsBaseModelArray
    ? LiteralsBaseModelArrayValues<L>
    : never;

export type LiteralsModelAttributeName<L extends Literals> = L extends LiteralsArray
  ? "value"
  : L extends LiteralsBaseModelArray
    ? Exclude<keyof L[number], "accessor">
    : never;

export type LiteralsBaseModelArrayAttributeValues<
  L extends readonly LiteralsBaseModel[],
  N extends string,
> = N extends LiteralsModelAttributeName<L>
  ? L extends readonly [infer Li extends LiteralsBaseModel]
    ? readonly [Li[N]]
    : L extends readonly [
          infer Li extends LiteralsBaseModel,
          ...infer R extends LiteralsBaseModel[],
        ]
      ? readonly [Li[N], ...LiteralsBaseModelArrayAttributeValues<R, N>]
      : never
  : never;

export type LiteralsAttributeValues<
  L extends Literals,
  N extends LiteralsModelAttributeName<L>,
> = L extends LiteralsBaseModelArray
  ? LiteralsBaseModelArrayAttributeValues<L, N>
  : L extends LiteralsArray
    ? L
    : never;

export type LiteralsAttributeValue<
  L extends Literals,
  V extends LiteralsValue<L>,
  N extends LiteralsModelAttributeName<L>,
> = L extends LiteralsBaseModelArray
  ? Extract<L[number], { value: V }>[N]
  : N extends "value"
    ? Extract<L[number], V>
    : never;

export type LiteralsModels<L extends Literals> = L extends LiteralsArray
  ? LiteralsArrayModels<L>
  : L;

export type ExtractLiteralsFromModelArray<
  L extends LiteralsBaseModelArray,
  I extends readonly string[],
> = L extends readonly [infer Li extends LiteralsBaseModel]
  ? Li["value"] extends I[number]
    ? readonly [Li]
    : readonly []
  : L extends readonly [infer H extends LiteralsBaseModel, ...infer R extends LiteralsBaseModel[]]
    ? H["value"] extends I[number]
      ? readonly [H, ...ExtractLiteralsFromModelArray<R, I>]
      : ExtractLiteralsFromModelArray<R, I>
    : never;

export type ExtractLiteralsFromArray<
  L extends LiteralsArray,
  I extends readonly string[],
> = L extends readonly [infer Li extends string]
  ? Li extends I[number]
    ? readonly [Li]
    : readonly []
  : L extends readonly [infer H extends string, ...infer R extends LiteralsArray]
    ? H extends I[number]
      ? readonly [H, ...ExtractLiteralsFromArray<R, I>]
      : ExtractLiteralsFromArray<R, I>
    : never;

export type ExtractLiterals<
  L extends Literals,
  I extends readonly string[],
> = L extends LiteralsArray
  ? ExtractLiteralsFromArray<L, I>
  : L extends LiteralsBaseModelArray
    ? ExtractLiteralsFromModelArray<L, I>
    : never;

export type ExcludeLiteralsFromModelArray<
  L extends LiteralsBaseModelArray,
  I extends readonly string[],
> = L extends readonly [infer Li extends LiteralsBaseModel]
  ? Li["value"] extends I[number]
    ? readonly []
    : readonly [Li]
  : L extends readonly [infer H extends LiteralsBaseModel, ...infer R extends LiteralsBaseModel[]]
    ? H["value"] extends I[number]
      ? ExtractLiteralsFromModelArray<R, I>
      : readonly [H, ...ExtractLiteralsFromModelArray<R, I>]
    : never;

export type ExcludeiteralsFromArray<
  L extends LiteralsArray,
  I extends readonly string[],
> = L extends readonly [infer Li extends string]
  ? Li extends I[number]
    ? readonly []
    : readonly [Li]
  : L extends readonly [infer H extends string, ...infer R extends LiteralsArray]
    ? H extends I[number]
      ? ExtractLiteralsFromArray<R, I>
      : readonly [H, ...ExtractLiteralsFromArray<R, I>]
    : never;

export type ExcludeLiterals<
  L extends Literals,
  I extends readonly string[],
> = L extends LiteralsArray
  ? ExcludeiteralsFromArray<L, I>
  : L extends LiteralsBaseModelArray
    ? ExcludeLiteralsFromModelArray<L, I>
    : never;
