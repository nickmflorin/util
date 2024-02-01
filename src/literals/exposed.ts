import { type z } from "zod";

import { type EnumeratedLiteralsAccessors } from "./accessors";
import {
  type Literals,
  type LiteralsValues,
  type LiteralsArray,
  type LiteralsValue,
  type ExcludeLiterals,
  type ExtractLiterals,
  type LiteralsBaseModelArray,
  type LiteralsModels,
  type LiteralsModelAttributeName,
  type LiteralsAttributeValues,
  type LiteralsAttributeValue,
} from "./core";
import {
  type EnumeratedLiteralsOptions,
  type OptionsWithNewSet,
  type EnumeratedLiteralsDynamicOptions,
} from "./options";

type EnumeratedLiteralsAssertion<L extends Literals> = (
  value: unknown,
  errorMessage?: string,
) => asserts value is LiteralsValue<L>;

export type LiteralsModel<
  L extends Literals,
  V extends LiteralsValue<L> = LiteralsValue<L>,
> = L extends LiteralsArray
  ? V extends LiteralsValue<L>
    ? { value: V }
    : never
  : L extends LiteralsBaseModelArray
    ? V extends LiteralsValue<L>
      ? Extract<L[number], { value: V }>
      : never
    : never;

export type GetModelSafeOptions = {
  readonly strict?: boolean;
};

export type GetModelSafeRT<L extends Literals, O extends GetModelSafeOptions> = O extends {
  strict: true;
}
  ? LiteralsModel<L, LiteralsValue<L>>
  : LiteralsModel<L, LiteralsValue<L>> | null;

type GetModelSafe<L extends Literals> = {
  <O extends GetModelSafeOptions>(value: unknown, opts: O): GetModelSafeRT<L, O>;
};

export type EnumeratedLiteralsType<L> = L extends EnumeratedLiterals<
  infer Ll extends Literals,
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  infer O
>
  ? LiteralsValue<Ll>
  : never;

export type EnumeratedLiteralsModel<L> = L extends EnumeratedLiterals<
  infer Ll extends Literals,
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  infer O
>
  ? LiteralsModel<Ll, LiteralsValue<Ll>>
  : never;

/**
 * A generic type that results in a type referred to internally as a set of "EnumeratedLiterals",
 * which is formed from the strings defined in the read-only array type defined by the generic type
 * parameter {@link V}.
 *
 * Generally, a set of {@link EnumeratedLiterals} is defined as an object that is used to represent
 * the discrete, literal {@link string} values that a given variable can exhibit, by providing both
 * properties to access the discrete values themselves and a property to access an {@link Array} of
 * all possible discrete values.
 *
 * This type should be used when defining discrete values that a variable can exhibit.
 *
 * Usage
 * -----
 * Assume that we have a variable Permission that can take on values "admin", "dev" or "user".  The
 * {@link EnumeratedLiterals} of those values can be represented as:
 *
 *   EnumeratedLiterals<readonly ["admin", "dev", "user"]>
 *
 * Which will look as follows:
 *
 *   { ADMIN: "admin", DEV: "dev", USER: "user", __ALL__: readonly ["admin", "dev", "user"] }
 */
export type EnumeratedLiterals<
  L extends Literals,
  O extends EnumeratedLiteralsOptions<L>,
> = EnumeratedLiteralsAccessors<L, O> & {
  readonly values: LiteralsValues<L>;
  readonly models: LiteralsModels<L>;
  readonly options: O;
  readonly schema: z.ZodUnion<
    readonly [z.ZodLiteral<LiteralsValues<L>[number]>, ...z.ZodLiteral<LiteralsValues<L>[number]>[]]
  >;
  readonly getAttributes: <N extends LiteralsModelAttributeName<L>>(
    attribute: N,
  ) => LiteralsAttributeValues<L, N>;
  readonly getAttribute: <V extends LiteralsValue<L>, N extends LiteralsModelAttributeName<L>>(
    value: V,
    attribute: N,
  ) => LiteralsAttributeValue<L, V, N>;
  readonly getModel: <V extends LiteralsValue<L>>(v: V) => LiteralsModel<L, V>;
  readonly getModelSafe: GetModelSafe<L>;
  /**
   * A method that returns the unknown value after an assertion has been applied guaranteeing that
   * the provided value is in the set of constants defined by the enumerated literals instance,
   * {@link EnumeratedLiteral}.
   *
   * @example
   * const ValidSizes = enumeratedLiterals(["small", "medium", "large"] as const);
   * type ValidSize = EnumeratedLiteralType<typeof ValidSizes>;
   *
   * const MyComponent = ({ size, ...props }: { size: ValidSize, ... }): JSX.Element => {
   *   return <></>
   * }
   *
   * const ParentComponent = ({ size, ...props }: { size: string, ... }): JSX.Element => {
   *   // The `size` prop is now type-safe because if it is not a valid size, an error will be
   *   // thrown.
   *   return <MyComponent {...props} size={ValidSizes.parse(size)} />
   * }
   */
  readonly parse: (v: unknown, errorMessage?: string) => LiteralsValue<L>;
  readonly assert: EnumeratedLiteralsAssertion<L>;
  /**
   * A type guard that returns whether or not the provided value is in the set of constants included
   * in the literals, {@link EnumeratedLiterals} and is thus of the type
   * {@link EnumeratedLiteralType} that associated with the set of literals.
   *
   * @example
   * const ValidSizes = enumeratedLiterals(["small", "medium", "large"] as const);
   * type ValidSize = EnumeratedLiteralType<typeof ValidSizes>;
   *
   * const MyComponent = ({ size, ...props }: { size: ValidSize, ... }): JSX.Element => {
   *   return <></>
   * }
   *
   * const ParentComponent = ({ size, ...props }: { size: string, ... }): JSX.Element => {
   *   if (ValidSizes.contains(size)) {
   *     // The `size` prop is now type-safe and guaranteed to be of type ValidSize.
   *     return <MyComponent {...props} size={size} />
   *   }
   *   return <></>
   * }
   */
  readonly contains: (v: unknown) => v is LiteralsValue<L>;
  /**
   * Returns a new enumerated literals instance, {@link EnumeratedLiterals}, that is formed from
   * a provided subset of the constants associated with the original enumerated literals instance,
   * {@link EnumeratedLiterals}.
   *
   * @example
   * const Constants = enumeratedLiterals(["a", "b"] as const);
   * // EnumeratedLiterals<readonly ["a"]>;
   * const NewConstants = Constants.pick(["a", "d"] as const);
   */
  readonly pick: <
    T extends readonly string[],
    Ot extends EnumeratedLiteralsDynamicOptions<ExtractLiterals<L, T>>,
  >(
    vs: T,
    opts?: Ot,
  ) => EnumeratedLiterals<
    ExtractLiterals<L, T>,
    OptionsWithNewSet<ExtractLiterals<L, T>, Ot, L, O>
  >;
  /**
   * Returns a new enumerated literals instance, {@link EnumeratedLiterals}, that is formed from
   * a the constants associated with the original enumerated literals instance,
   * {@link EnumeratedLiterals}, excluding the constants provided as a readonly array to the method,
   * {@link T}.
   *
   * @example
   * const Constants = enumeratedLiterals(["a", "b"] as const);
   * // EnumeratedLiterals<readonly ["a"]>;
   * const NewConstants = Constants.omit(["b"] as const);
   */
  readonly omit: <
    T extends readonly string[],
    Ot extends EnumeratedLiteralsDynamicOptions<ExcludeLiterals<L, T>>,
  >(
    vs: T,
    opts?: Ot,
  ) => EnumeratedLiterals<
    ExcludeLiterals<L, T>,
    OptionsWithNewSet<ExcludeLiterals<L, T>, Ot, L, O>
  >;
  readonly throwInvalidValue: (v: unknown, errorMessage?: string) => void;
};
