import { type Literals, type LiteralsBaseModelArray, type LiteralsArray } from "./core";
import {
  type EnumeratedLiteralsOptions,
  type DefaultAccessorOptions,
  getDefaultLiteralsAccessorOptions,
} from "./options";

export type AccessorCase = "upper" | "lower" | null;

export type ParseAccessorCase<
  L extends Literals,
  O extends EnumeratedLiteralsOptions<L>,
> = O extends {
  accessorCase: infer S;
}
  ? S extends AccessorCase
    ? S
    : never
  : DefaultAccessorOptions<L>["accessorCase"];

export type FormatAccessorCase<
  S extends string,
  L extends Literals,
  O extends EnumeratedLiteralsOptions<L>,
> = ParseAccessorCase<L, O> extends "upper"
  ? Uppercase<S>
  : ParseAccessorCase<L, O> extends "lower"
    ? Lowercase<S>
    : ParseAccessorCase<L, O> extends null
      ? S
      : never;

export type AccessorSpaceReplacement = "_" | "-" | "";

export type ParseAccessorSpaceReplacement<
  L extends Literals,
  O extends EnumeratedLiteralsOptions<L>,
> = O extends {
  accessorSpaceReplacement: infer S;
}
  ? S extends AccessorSpaceReplacement
    ? S
    : never
  : DefaultAccessorOptions<L>["accessorSpaceReplacement"];

type ReplaceSpacesWith<
  T extends string,
  R extends AccessorSpaceReplacement,
> = T extends `${infer V extends string} ${infer L extends string}`
  ? ReplaceSpacesWith<`${V}${R}${L}`, R>
  : T;

export type FormatAccessorSpaces<
  S extends string,
  L extends Literals,
  O extends EnumeratedLiteralsOptions<L>,
> = ParseAccessorSpaceReplacement<L, O> extends "_"
  ? ReplaceSpacesWith<S, "_">
  : ParseAccessorCase<L, O> extends "-"
    ? ReplaceSpacesWith<S, "-">
    : ParseAccessorSpaceReplacement<L, O> extends ""
      ? ReplaceSpacesWith<S, "">
      : never;

export type AccessorHyphenReplacement = "_" | "" | null;

export type ParseAccessorHyphenReplacement<
  L extends Literals,
  O extends EnumeratedLiteralsOptions<L>,
> = O extends {
  accessorHyphenReplacement: infer S;
}
  ? S extends AccessorSpaceReplacement
    ? S
    : never
  : DefaultAccessorOptions<L>["accessorHyphenReplacement"];

type ReplaceHyphensWith<
  T extends string,
  R extends Extract<AccessorHyphenReplacement, string>,
> = T extends `${infer V extends string}-${infer L extends string}`
  ? ReplaceHyphensWith<`${V}${R}${L}`, R>
  : T;

export type FormatAccessorHyphens<
  S extends string,
  L extends Literals,
  O extends EnumeratedLiteralsOptions<L>,
> = ParseAccessorHyphenReplacement<L, O> extends "_"
  ? ReplaceHyphensWith<S, "_">
  : ParseAccessorHyphenReplacement<L, O> extends ""
    ? ReplaceHyphensWith<S, "">
    : ParseAccessorHyphenReplacement<L, O> extends null
      ? S
      : never;

export type LiteralsAccessor<
  V extends string,
  L extends Literals,
  O extends EnumeratedLiteralsOptions<L>,
> = V extends string
  ? FormatAccessorSpaces<FormatAccessorHyphens<FormatAccessorCase<V, L, O>, L, O>, L, O>
  : never;

export type EnumeratedLiteralsBaseModelArrayAccessors<
  L extends LiteralsBaseModelArray,
  O extends EnumeratedLiteralsOptions<L>,
> = {
  // It is important to condition the key on string such that it distributes over the union.
  [key in keyof L as key extends string
    ? L[key] extends { accessor: infer A extends string }
      ? LiteralsAccessor<A, L, O>
      : L[key] extends { value: infer V extends string }
        ? LiteralsAccessor<V, L, O>
        : never
    : never]: L[key]["value"];
};

export type EnumeratedLiteralsArrayAccessors<
  L extends LiteralsArray,
  O extends EnumeratedLiteralsOptions<L>,
> = {
  [key in keyof L as L[key] extends string ? LiteralsAccessor<L[key], L, O> : never]: L[key];
};

export type EnumeratedLiteralsAccessors<
  L extends Literals,
  O extends EnumeratedLiteralsOptions<L>,
> = L extends LiteralsArray
  ? EnumeratedLiteralsArrayAccessors<L, O>
  : L extends LiteralsBaseModelArray
    ? EnumeratedLiteralsBaseModelArrayAccessors<L, O>
    : never;

export const toLiteralAccessor = <
  V extends string,
  L extends Literals,
  O extends EnumeratedLiteralsOptions<L>,
>(
  v: V,
  literals: L,
  options: O,
): LiteralsAccessor<V, L, O> => {
  const opts = { ...getDefaultLiteralsAccessorOptions(literals), ...options };

  let accessor = v as string;
  if (opts.accessorCase === "upper") {
    accessor = accessor.toUpperCase();
  } else if (opts.accessorCase === "lower") {
    accessor = accessor.toLowerCase();
  }
  if (opts.accessorHyphenReplacement) {
    accessor = accessor.replaceAll("-", opts.accessorHyphenReplacement);
  }
  accessor = accessor.replaceAll(" ", opts.accessorSpaceReplacement);
  return accessor as LiteralsAccessor<V, L, O>;
};
