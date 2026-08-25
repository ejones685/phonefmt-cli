import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { parseArgs } from "./cli.js";
import type { FormatOptions } from "./phone.js";

interface ParseArgsFixture {
  description: string;
  argv: string[];
  expected?: FormatOptions | null;
  throws?: boolean;
}

interface EndToEndFixture {
  description: string;
  argv: string[];
  stdin: string;
  expectedStdout: string;
  expectedExitCode?: number;
}

const here = dirname(fileURLToPath(import.meta.url));
const fixturesPath = join(here, "..", "test", "fixtures", "cli.json");
const fixtures: { parseArgs: ParseArgsFixture[]; endToEnd: EndToEndFixture[] } = JSON.parse(
  readFileSync(fixturesPath, "utf8")
);
const cliPath = join(here, "cli.js");

for (const fx of fixtures.parseArgs) {
  test(`parseArgs: ${fx.description}`, () => {
    if (fx.throws) {
      assert.throws(() => parseArgs(fx.argv));
    } else {
      assert.deepEqual(parseArgs(fx.argv), fx.expected ?? null);
    }
  });
}

for (const fx of fixtures.endToEnd) {
  test(`cli end-to-end: ${fx.description}`, () => {
    const result = spawnSync(process.execPath, [cliPath, ...fx.argv], {
      input: fx.stdin,
      encoding: "utf8",
    });
    assert.equal(result.stdout, fx.expectedStdout);
    if (fx.expectedExitCode !== undefined) {
      assert.equal(result.status, fx.expectedExitCode);
    }
  });
}
