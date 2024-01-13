import { withTypescriptConfig } from "../../jest.config.base";

export default withTypescriptConfig(__dirname, {
  displayName: "Unit Tests",
  testMatch: [`${__dirname}/**/*.test.ts`],
});
