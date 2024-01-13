type HumanizeListIteree = string | number;

type HumanizeListOptions<T extends HumanizeListIteree> = {
  readonly conjunction?: "and" | "or";
  readonly oxfordComma?: boolean;
  readonly delimiter?: string;
  readonly formatter?: (value: T) => string;
};

export const humanizeList = <T extends HumanizeListIteree>(
  values: T[],
  options?: HumanizeListOptions<T>,
) => {
  const {
    conjunction = "and",
    oxfordComma = true,
    delimiter = ",",
    formatter = (value: T) => value.toString(),
  } = options || {};
  if (values.length === 0) {
    return "";
  } else if (values.length === 1) {
    return formatter(values[0]);
  }
  let humanized = values
    .slice(0, values.length - 1)
    .map(v => formatter(v))
    .join(delimiter.trim() + " ");
  if (values.length >= 3 && oxfordComma) {
    humanized += delimiter.trim();
  }
  return [humanized, conjunction.trim(), formatter(values[values.length - 1])].join(" ");
};
