import difference from "lodash.difference";
import intesection from "lodash.intersection";
import pick from "lodash.pick";
import { z } from "zod";

import { humanizeList } from "../formatters";

import { type EnumeratedLiteralsAccessors, toLiteralAccessor } from "./accessors";
import {
  type Literals,
  type LiteralsValues,
  type LiteralsValue,
  type ExcludeLiterals,
  type ExtractLiterals,
  isLiteralModel,
  type LiteralsModels,
  type LiteralsAttributeValues,
  type LiteralsAttributeValue,
  type LiteralsModelAttributeName,
} from "./core";
import {
  type EnumeratedLiterals,
  type LiteralsModel,
  type GetModelSafeRT,
  type GetModelSafeOptions,
} from "./exposed";
import {
  type EnumeratedLiteralsOptions,
  ENUMERATED_LITERALS_STATIC_OPTIONS,
  type EnumeratedLiteralsDynamicOptions,
  type OptionsWithNewSet,
} from "./options";

export {
  type EnumeratedLiterals,
  type EnumeratedLiteralsType,
  type EnumeratedLiteralsModel,
} from "./exposed";

type MoreThan2Array<V> = [V, V, ...V[]];

/**
 * A generic type that results in a type referred to internally as an "EnumeratedLiteralMap", which
 * is formed from the strings defined in the read-only array type defined by the generic type
 * parameter {@link V}.
 *
 * Generally, an {@link EnumeratedLiterals} is defined as an object that is used to represent the
 * discrete, literal {@link string} values that a given variable can exhibit, by providing both
 * properties to access the discrete values themselves and a property to access an {@link Array} of
 * all possible discrete values.
 *
 * This type should be used when defining discrete values that a variable can exhibit, as it defines
 * both accessors for those constants and an accessor for all possible options.
 *
 * @example
 * const Permissions = enumeratedLiterals(["admin", "dev", "user"] as const)
 * Permissions.ADMIN // "admin"
 * Permissions.__ALL__ // ["admin", "dev", "user"]
 *
 * @param {types.UniqueArray<L, O>} data
 *   A read-only array of values that the variable is allowed to exhibit.
 *
 * @returns {@link EnumeratedLiterals<L, O>}
 */
export const enumeratedLiterals = <L extends Literals, O extends EnumeratedLiteralsOptions<L>>(
  literals: L,
  options: O,
): EnumeratedLiterals<L, O> => {
  let seen: [string, string][] = [];

  const values = [...literals].map(l => (isLiteralModel(l) ? l.value : l)) as LiteralsValues<L>;
  const models = [...literals].map(l =>
    isLiteralModel(l) ? l : { value: l },
  ) as LiteralsModels<L>;

  const accessors: EnumeratedLiteralsAccessors<L, O> = [...literals].reduce<
    EnumeratedLiteralsAccessors<L, O>
  >(
    (acc, curr) => {
      const key = (isLiteralModel(curr) ? curr.value : curr) as string;
      const accessor = toLiteralAccessor(key, literals, options);
      const ind = seen.findIndex(([a]) => a === accessor);
      if (ind !== -1) {
        if (seen[ind][0] === key) {
          throw new Error(
            `Encountered duplicate literal values '${key}'!  The literals must be unique.`,
          );
        }
        throw new Error(
          `Encountered two literals, '${seen[ind][0]}' and '${key}', that map to the same ` +
            `accessor, '${accessor}'!  The literals must map to unique accessors.`,
        );
      }
      seen = [...seen, [key, accessor]];
      return { ...acc, [accessor]: isLiteralModel(curr) ? curr.value : curr };
    },
    {} as EnumeratedLiteralsAccessors<L, O>,
  );

  return {
    ...accessors,
    options,
    values,
    models,
    getAttributes<N extends LiteralsModelAttributeName<L>>(
      attribute: N,
    ): LiteralsAttributeValues<L, N> {
      const attrs: LiteralsAttributeValues<L, N>[number][] = [];
      for (const m of this.models) {
        attrs.push(m[attribute]);
      }
      return attrs as LiteralsAttributeValues<L, N>;
    },
    getAttribute<V extends LiteralsValue<L>, N extends LiteralsModelAttributeName<L>>(
      value: V,
      attribute: N,
    ): LiteralsAttributeValue<L, V, N> {
      const attr = this.getModel(value)[attribute];
      return attr as LiteralsAttributeValue<L, V, N>;
    },
    getModel<V extends LiteralsValue<L>>(
      this: EnumeratedLiterals<L, O>,
      v: V,
    ): LiteralsModel<L, V> {
      this.assert(v);
      const found = this.models.find(l => l.value === v);
      if (!found) {
        this.throwInvalidValue(v);
      }
      return found as LiteralsModel<L, V>;
    },
    getModelSafe<Og extends GetModelSafeOptions>(
      this: EnumeratedLiterals<L, O>,
      v: unknown,
      opts: Og,
    ): GetModelSafeRT<L, Og> {
      const contains = this.contains(v);
      if (contains === false) {
        if (opts?.strict === true) {
          this.throwInvalidValue(v);
        }
        return null as GetModelSafeRT<L, Og>;
      }
      return this.getModel(v as LiteralsValue<L>);
    },
    schema: z.union(
      values.map(v => z.literal(v)) as MoreThan2Array<z.ZodLiteral<LiteralsValues<L>[number]>>,
    ),
    throwInvalidValue(this: EnumeratedLiterals<L, O>, v: unknown, errorMessage?: string): never {
      if (errorMessage === undefined && this.options.invalidValueErrorMessage !== undefined) {
        throw new Error(this.options.invalidValueErrorMessage(this.values, v));
      }
      if (errorMessage) {
        throw new Error(errorMessage);
      } else if (this.values.length === 0) {
        throw new Error(
          "The values on the literals instance are empty, this should not be allowed!",
        );
      } else if (this.values.length === 1) {
        throw new Error(
          `The value ${JSON.stringify(v)} is not valid, it must be ${this.values[0]}.`,
        );
      }
      const humanizedValues = humanizeList([...this.values], { conjunction: "or" });
      throw new Error(
        `The value ${JSON.stringify(v)} is not valid, it must be one of ${humanizedValues}.`,
      );
    },
    contains(this: EnumeratedLiterals<L, O>, v: unknown): v is LiteralsValue<L> {
      return this.schema.safeParse(v).success;
    },
    parse(this: EnumeratedLiterals<L, O>, v: unknown, errorMessage?: string): LiteralsValue<L> {
      this.assert(v, errorMessage);
      return v;
    },
    assert(this: EnumeratedLiterals<L, O>, v: unknown, errorMessage?: string) {
      if (!this.contains(v)) {
        this.throwInvalidValue(v, errorMessage);
      }
    },
    pick<
      T extends readonly string[],
      Ot extends EnumeratedLiteralsDynamicOptions<ExtractLiterals<L, T>>,
    >(
      this: EnumeratedLiterals<L, O>,
      vs: T,
      opts?: Ot,
    ): EnumeratedLiterals<
      ExtractLiterals<L, T>,
      OptionsWithNewSet<ExtractLiterals<L, T>, Ot, L, O>
    > {
      const extracted = intesection([...this.values], [...vs]) as ExtractLiterals<L, T>;
      const newOptions = {
        ...pick(this.options, ENUMERATED_LITERALS_STATIC_OPTIONS),
        ...opts,
      };
      return enumeratedLiterals(extracted, newOptions);
    },
    omit<
      T extends readonly string[],
      Ot extends EnumeratedLiteralsDynamicOptions<ExcludeLiterals<L, T>>,
    >(
      this: EnumeratedLiterals<L, O>,
      vs: T,
      opts?: Ot,
    ): EnumeratedLiterals<
      ExcludeLiterals<L, T>,
      OptionsWithNewSet<ExcludeLiterals<L, T>, Ot, L, O>
    > {
      const excluded = difference([...this.values], [...vs]) as ExcludeLiterals<L, T>;
      return enumeratedLiterals(excluded, {
        ...pick(this.options, ENUMERATED_LITERALS_STATIC_OPTIONS),
        ...opts,
      });
    },
  };
};
