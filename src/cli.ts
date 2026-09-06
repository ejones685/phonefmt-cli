#!/usr/bin/env node
import * as readline from "node:readline";
import {
  countMatches,
  isWrappedAcrossLines,
  reformatLine,
  stripLine,
  type FormatOptions,
} from "./phone.js";

export interface CliOptions extends FormatOptions {
  count: boolean;
  strip: boolean;
}

function printUsage(): void {
  process.stderr.write(
    `phonefmt - reformat phone numbers found in text

Usage:
  phonefmt [--to e164|national] [--country <code>] [--count | --strip] < input.txt
  some-command | phonefmt --to national

Reads lines from stdin, finds phone numbers in each one, rewrites them
in the target format, and writes the line to stdout immediately. Input
is processed one line at a time and never buffered in full, so it is
safe to pipe in files larger than available memory. A number split by
a line wrap is joined with the following line before formatting, so
each line is held back by at most one line of lookahead.

Options:
  --to <e164|national>   output format (default: e164)
  --country <code>       calling code to assume for bare 10-digit
                          numbers, digits only (default: 1)
  --count                print the number of phone numbers found
                          instead of rewriting the input
  --strip                remove matched phone numbers from the input
                          instead of reformatting them
  -h, --help             show this message
`
  );
}

export function parseArgs(argv: string[]): CliOptions | null {
  const opts: CliOptions = { to: "e164", country: "1", count: false, strip: false };
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

  // Held back by one line so a number that got wrapped across the line
  // break can be joined with what follows before it's formatted or
  // counted. This is the only lookback the CLI keeps; everything else is
  // still processed and released line by line.
  let pending: string | null = null;
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
  };

  rl.on("line", (line) => {
    if (pending !== null && isWrappedAcrossLines(pending, line, opts)) {
      pending += line;
      return;
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
