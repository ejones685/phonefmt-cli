# phonefmt

Phone numbers show up in logs, CSV exports, and chat dumps in a dozen
inconsistent shapes: `(555) 123-4567`, `555.123.4567`, `+1 555 123 4567`,
`5551234567`. phonefmt scans text and rewrites whatever it finds into one
consistent format, either E.164 (`+15551234567`) or a readable national
format (`(555) 123-4567`), while leaving the rest of each line untouched.

It's a filter: it reads stdin, writes stdout, and does nothing else.

## Usage

```
phonefmt [--to e164|national] [--country <code>] < input.txt
some-command | phonefmt --to national
```

Example:

```
$ echo "call me at 555.123.4567 or (800) 456-7890" | phonefmt
call me at +15551234567 or +18004567890

$ echo "call me at 555.123.4567" | phonefmt --to national
call me at (555) 123-4567
```

Options:

- `--to e164|national` — output format. `e164` (the default) produces
  `+15551234567`. `national` produces `(555) 123-4567` for NANP-length
  numbers and falls back to E.164 for anything else.
- `--country <code>` — calling code to assume for bare 10-digit numbers
  that have no country code of their own. Defaults to `1` (NANP).

Numbers that already start with `+` are passed through with formatting
punctuation stripped, since matching them against the right country's
numbering plan needs a prefix table this tool doesn't have yet (see
Roadmap).

## Why streaming matters

The intended use is piping in things like multi-gigabyte log files or
CSV exports, not just short strings on the command line. phonefmt reads
stdin line by line with Node's `readline` module and writes each result
to stdout as soon as it's ready. It never buffers the whole input in
memory, so a 10 GB file costs about as much memory as a 10 KB one.

## Building

Requires Node 18+ and the TypeScript compiler (a devDependency, not a
runtime one):

```
npm install
npm run build
node dist/cli.js --help
```

## Limitations (first pass)

- Only NANP (US/Canada, `+1`) numbers get real formatting logic.
  Numbers with other country codes are stripped of punctuation but not
  reformatted.
- No validation against real area code or exchange assignments — any
  10-digit run of digits in the right shape is treated as a number.
- Numbers split across a line wrap won't be detected, since matching
  happens one line at a time.

## License

MIT, see [LICENSE](LICENSE).
