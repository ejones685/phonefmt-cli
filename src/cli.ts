#!/usr/bin/env node
import * as readline from "node:readline";
import { countMatches, reformatLine, type FormatOptions } from "./phone.js";

export interface CliOptions extends FormatOptions {
  count: boolean;
}

function printUsage(): void {
  process.stderr.write(
    `phonefmt - reformat phone numbers found in text

Usage:
  phonefmt [--to e164|national] [--country <code>] [--count] < input.txt
  some-command | phonefmt --to national

Reads lines from stdin, finds phone numbers in each one, rewrites them
in the target format, and writes the line to stdout immediately. Input
is processed one line at a time and never buffered in full, so it is
safe to pipe in files larger than available memory.

Options:
  --to <e164|national>   output format (default: e164)
  --country <code>       calling code to assume for bare 10-digit
                          numbers, digits only (default: 1)
  --count                print the number of phone numbers found
                          instead of rewriting the input
  -h, --help             show this message
`
  );
}

export function parseArgs(argv: string[]): CliOptions | null {
  const opts: CliOptions = { to: "e164", country: "1", count: false };
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
      default:
        throw new Error(`unrecognized argument: ${arg}`);
    }
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

  if (opts.count) {
    let total = 0;
    rl.on("line", (line) => {
      total += countMatches(line, opts);
    });
    rl.on("close", () => {
      process.stdout.write(`${total}\n`);
    });
    return;
  }

  rl.on("line", (line) => {
    process.stdout.write(reformatLine(line, opts) + "\n");
  });
}

main();
