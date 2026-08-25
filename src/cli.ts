#!/usr/bin/env node
import * as readline from "node:readline";
import { reformatLine, type FormatOptions } from "./phone.js";

function printUsage(): void {
  process.stderr.write(
    `phonefmt - reformat phone numbers found in text

Usage:
  phonefmt [--to e164|national] [--country <code>] < input.txt
  some-command | phonefmt --to national

Reads lines from stdin, finds phone numbers in each one, rewrites them
in the target format, and writes the line to stdout immediately. Input
is processed one line at a time and never buffered in full, so it is
safe to pipe in files larger than available memory.

Options:
  --to <e164|national>   output format (default: e164)
  --country <code>       calling code to assume for bare 10-digit
                          numbers, digits only (default: 1)
  -h, --help             show this message
`
  );
}

export function parseArgs(argv: string[]): FormatOptions | null {
  const opts: FormatOptions = { to: "e164", country: "1" };
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
      default:
        throw new Error(`unrecognized argument: ${arg}`);
    }
  }
  return opts;
}

function main(): void {
  let opts: FormatOptions | null;
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

  rl.on("line", (line) => {
    process.stdout.write(reformatLine(line, opts) + "\n");
  });
}

main();
