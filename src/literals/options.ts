import {
  type AccessorCase,
  type AccessorSpaceReplacement,
  type AccessorHyphenReplacement,
} from "./accessors";
import {
  type Literals,
  type LiteralsBaseModelArray,
  type LiteralsValues,
  type LiteralsArray,
  literalsAreArray,
  literalsAreModelArray,
} from "./core";

export type DefaultAccessorOptions<L extends Literals> = L extends LiteralsArray
  ? {
      readonly accessorSpaceReplacement: "_";
      readonly accessorHyphenReplacement: "_";
      readonly accessorCase: "upper";
    }
  : L extends LiteralsBaseModelArray
    ? {
        readonly accessorSpaceReplacement: "_";
        readonly accessorHyphenReplacement: null;
        readonly accessorCase: null;
      }
    : never;

export const DEFAULT_ACCESSOR_ARRAY_OPTIONS: DefaultAccessorOptions<LiteralsArray> = {
  accessorSpaceReplacement: "_" as const,
  accessorHyphenReplacement: "_" as const,
  accessorCase: "upper",
};

/*
If the accessors are explicitly provided on the model, we assume that the developer has provided the
explicit, literal accessor they want to be used, and unless they explicitly provide the options for
space replacement, hyphen replacement or casing, we will assume the minimal defaults such that the
accessor they provide is transformed the least amount.
*/
export const DEFAULT_ACCESSOR_MODEL_ARRAY_OPTIONS: DefaultAccessorOptions<LiteralsBaseModelArray> =
  {
    accessorSpaceReplacement: "_" as const,
    accessorHyphenReplacement: null,
    accessorCase: null,
  };

export const getDefaultLiteralsAccessorOptions = <L extends Literals>(
  literals: L,
): DefaultAccessorOptions<L> => {
  if (literalsAreModelArray(literals)) {
    return DEFAULT_ACCESSOR_MODEL_ARRAY_OPTIONS as DefaultAccessorOptions<L>;
  } else if (literalsAreArray(literals)) {
    return DEFAULT_ACCESSOR_ARRAY_OPTIONS as DefaultAccessorOptions<L>;
  }
  throw new Error("");
};

export type EnumeratedLiteralsInvalidValueErrorMessage<L extends Literals> = (
  values: LiteralsValues<L>,
  value: unknown,
) => string;

export type EnumeratedLiteralsDynamicOptions<L extends Literals> = Partial<{
  readonly invalidValueErrorMessage: EnumeratedLiteralsInvalidValueErrorMessage<L>;
}>;

export type EnumeratedLiteralsOptions<L extends Literals> = EnumeratedLiteralsDynamicOptions<L> &
  Partial<{
    readonly accessorSpaceReplacement: AccessorSpaceReplacement;
    readonly accessorHyphenReplacement: AccessorHyphenReplacement;
    readonly accessorCase: AccessorCase;
  }>;

export const ENUMERATED_LITERALS_STATIC_OPTIONS = [
  "accessorSpaceReplacement",
  "accessorHyphenReplacement",
  "accessorCase",
] as const;

export type OptionsWithNewSet<
  L extends Literals,
  O extends EnumeratedLiteralsDynamicOptions<L>,
  LOld extends Literals,
  OOld extends EnumeratedLiteralsOptions<LOld>,
> = Pick<OOld, "accessorCase" | "accessorHyphenReplacement" | "accessorSpaceReplacement"> &
  Pick<O, "invalidValueErrorMessage">;
