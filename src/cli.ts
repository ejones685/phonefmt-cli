#!/usr/bin/env node
import * as readline from "node:readline";
import {
  countMatches,
  isWrappedAcrossLines,
  mayContinueWrap,
  reformatLine,
  stripLine,
  type FormatOptions,
} from "./phone.js";

export interface CliOptions extends FormatOptions {
  count: boolean;
  strip: boolean;
  wrapLookahead: number;
}

function printUsage(): void {
  process.stderr.write(
    `phonefmt - reformat phone numbers found in text

Usage:
  phonefmt [--to e164|national] [--country <code>] [--wrap-lookahead <n>] [--count | --strip] < input.txt
  some-command | phonefmt --to national

Reads lines from stdin, finds phone numbers in each one, rewrites them
in the target format, and writes the line to stdout immediately. Input
is processed one line at a time and never buffered in full, so it is
safe to pipe in files larger than available memory. A number split by
a line wrap is joined with the following line(s) before formatting, so
each line is held back by at most --wrap-lookahead lines.

Options:
  --to <e164|national>   output format (default: e164)
  --country <code>       calling code to assume for bare 10-digit
                          numbers, digits only (default: 1)
  --wrap-lookahead <n>   max number of extra lines to hold back while
                          trying to complete a number split across a
                          line wrap (default: 1)
  --count                print the number of phone numbers found
                          instead of rewriting the input
  --strip                remove matched phone numbers from the input
                          instead of reformatting them
  -h, --help             show this message
`
  );
}

export function parseArgs(argv: string[]): CliOptions | null {
  const opts: CliOptions = {
    to: "e164",
    country: "1",
    count: false,
    strip: false,
    wrapLookahead: 1,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case "-h":
      case "--help":
        return null;
      case "--to": {
        const value = argv[++i];
        if (value !== "e164" && value !== "national") {
          throw new Error(`--to must be "e164" or "national", got ${JSON.stringify(value)}`);
        }
        opts.to = value;
        break;
      }
      case "--country": {
        const value = argv[++i];
        if (!value || !/^\d+$/.test(value)) {
          throw new Error(`--country must be digits only, got ${JSON.stringify(value)}`);
        }
        opts.country = value;
        break;
      }
      case "--wrap-lookahead": {
        const value = argv[++i];
        if (!value || !/^\d+$/.test(value) || Number(value) < 1) {
          throw new Error(
            `--wrap-lookahead must be a positive integer, got ${JSON.stringify(value)}`
          );
        }
        opts.wrapLookahead = Number(value);
        break;
      }
      case "--count":
        opts.count = true;
        break;
      case "--strip":
        opts.strip = true;
        break;
      default:
        throw new Error(`unrecognized argument: ${arg}`);
    }
  }
  if (opts.count && opts.strip) {
    throw new Error("--count and --strip cannot be used together");
  }
  return opts;
}

function main(): void {
  let opts: CliOptions | null;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (err) {
    process.stderr.write(`${(err as Error).message}\n`);
    process.exitCode = 1;
    return;
  }

  if (opts === null) {
    printUsage();
    return;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    crlfDelay: Infinity,
  });

  // Held back by up to opts.wrapLookahead lines so a number that got
  // wrapped across a line break can be joined with what follows before
  // it's formatted or counted. This is the only lookback the CLI keeps;
  // everything else is still processed and released line by line.
  let pending: string | null = null;
  let joinedLines = 0;
  let total = 0;

  const flush = (): void => {
    if (pending === null) return;
    if (opts.count) {
      total += countMatches(pending, opts);
    } else if (opts.strip) {
      process.stdout.write(stripLine(pending, opts) + "\n");
    } else {
      process.stdout.write(reformatLine(pending, opts) + "\n");
    }
    pending = null;
    joinedLines = 0;
  };

  rl.on("line", (line) => {
    if (pending !== null && joinedLines < opts.wrapLookahead) {
      if (isWrappedAcrossLines(pending, line, opts)) {
        pending += line;
        flush();
        return;
      }
      // Not complete yet, but if there's still lookahead budget left after
      // this line and it looks like more of the same number, keep holding
      // on rather than giving up after a single extra line.
      if (joinedLines + 1 < opts.wrapLookahead && mayContinueWrap(pending, line, opts)) {
        pending += line;
        joinedLines++;
        return;
      }
    }
    flush();
    pending = line;
  });

  rl.on("close", () => {
    flush();
    if (opts.count) {
      process.stdout.write(`${total}\n`);
    }
  });
}

main();
