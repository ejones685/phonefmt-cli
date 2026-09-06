import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  countMatches,
  formatNumber,
  isWrappedAcrossLines,
  reformatLine,
  stripLine,
  type FormatOptions,
} from "./phone.js";

interface FormatNumberFixture {
  description: string;
  raw: string;
  opts: FormatOptions;
  expected: string | null;
}

interface ReformatLineFixture {
  description: string;
  line: string;
  opts: FormatOptions;
  expected: string;
}

interface CountMatchesFixture {
  description: string;
  line: string;
  opts: FormatOptions;
  expected: number;
}

interface StripLineFixture {
  description: string;
  line: string;
  opts: FormatOptions;
  expected: string;
}

interface IsWrappedAcrossLinesFixture {
  description: string;
  prevLine: string;
  nextLine: string;
  opts: FormatOptions;
  expected: boolean;
}

const here = dirname(fileURLToPath(import.meta.url));
const fixturesPath = join(here, "..", "test", "fixtures", "phone.json");
const fixtures: {
  formatNumber: FormatNumberFixture[];
  reformatLine: ReformatLineFixture[];
  countMatches: CountMatchesFixture[];
  stripLine: StripLineFixture[];
  isWrappedAcrossLines: IsWrappedAcrossLinesFixture[];
} = JSON.parse(readFileSync(fixturesPath, "utf8"));

for (const fx of fixtures.formatNumber) {
  test(`formatNumber: ${fx.description}`, () => {
    assert.equal(formatNumber(fx.raw, fx.opts), fx.expected);
  });
}

for (const fx of fixtures.reformatLine) {
  test(`reformatLine: ${fx.description}`, () => {
    assert.equal(reformatLine(fx.line, fx.opts), fx.expected);
  });
}

for (const fx of fixtures.countMatches) {
  test(`countMatches: ${fx.description}`, () => {
    assert.equal(countMatches(fx.line, fx.opts), fx.expected);
  });
}

for (const fx of fixtures.stripLine) {
  test(`stripLine: ${fx.description}`, () => {
    assert.equal(stripLine(fx.line, fx.opts), fx.expected);
  });
}

for (const fx of fixtures.isWrappedAcrossLines) {
  test(`isWrappedAcrossLines: ${fx.description}`, () => {
    assert.equal(isWrappedAcrossLines(fx.prevLine, fx.nextLine, fx.opts), fx.expected);
  });
}
