# phonefmt

Phone numbers show up in logs, CSV exports, and chat dumps in a dozen
inconsistent shapes: `(555) 123-4567`, `555.123.4567`, `+1 555 123 4567`,
`5551234567`. phonefmt scans text and rewrites whatever it finds into one
consistent format, either E.164 (`+15551234567`) or a readable national
format (`(555) 123-4567`), while leaving the rest of each line untouched.

It's a filter: it reads stdin, writes stdout, and does nothing else.

## Usage

```
phonefmt [--to e164|national] [--country <code>] [--count | --strip] < input.txt
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
- `--count` — instead of rewriting the input, print the total number of
  phone numbers found across all lines and nothing else.
- `--strip` — remove matched phone numbers from the input instead of
  reformatting them. Surrounding whitespace and punctuation are left as
  they were, so `call 555-123-4567 now` becomes `call  now`. Cannot be
  combined with `--count`.

Numbers that already start with `+` are matched against a table of
~70 ITU calling codes and their national significant number lengths to
find the split between country code and subscriber number. Codes not
in the table are passed through with formatting punctuation stripped
rather than guessed at.

## Why streaming matters

The intended use is piping in things like multi-gigabyte log files or
CSV exports, not just short strings on the command line. phonefmt reads
stdin line by line with Node's `readline` module and writes each result
to stdout as soon as it's ready. It never buffers the whole input in
memory, so a 10 GB file costs about as much memory as a 10 KB one.

The one exception is a single line of lookahead: if a line ends mid
phone number, phonefmt holds it back and joins it with the next line
before deciding how to format it, so a number wrapped by whatever
produced the text (a terminal, a log formatter, an editor) still comes
out whole. That's at most one extra line held in memory, not the rest
of the input.

## Building

Requires Node 18+ and the TypeScript compiler (a devDependency, not a
runtime one):

```
npm install
npm run build
node dist/cli.js --help
```

## Testing

```
npm test
```

Runs the TypeScript compiler and then Node's built-in test runner against
the compiled output. Tests are fixture-based: `test/fixtures/phone.json`
and `test/fixtures/cli.json` hold the input/option/expected-output cases,
and `src/phone.test.ts` / `src/cli.test.ts` just iterate over them. Adding
a new case is usually adding a line to a fixture file, not writing new
test code.

## Limitations (first pass)

- Only NANP (US/Canada, `+1`) numbers get real national-format
  pretty-printing. Other countries are recognized well enough to split
  the country code from the subscriber number, but `--to national`
  falls back to E.164 for them since per-country formatting rules
  aren't implemented yet.
- The numbering-plan table covers common calling codes, not the full
  ITU assignment list. An unrecognized code is passed through with
  punctuation stripped rather than split.
- No validation against real area code or exchange assignments — any
  10-digit run of digits in the right shape is treated as a number.
- The line-wrap join only looks one line ahead. A number split across
  more than two physical lines won't be reassembled.

## License

MIT, see [LICENSE](LICENSE).
