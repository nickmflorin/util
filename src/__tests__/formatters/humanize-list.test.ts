import { humanizeList } from "~/formatters/humanize-list";

const VALUES = ["apple", "banana", "cherry", "durian", "elderberry", "fig", "grape"];

describe("humanizeList() properly returns", () => {
  it("properly returns with default options", () => {
    expect(humanizeList(VALUES)).toEqual(
      "apple, banana, cherry, durian, elderberry, fig, and grape",
    );
  });
});
