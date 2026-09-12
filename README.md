# phonefmt

Phone numbers show up in logs, CSV exports, and chat dumps in a dozen
inconsistent shapes: `(212) 555-4567`, `212.555.4567`, `+1 212 555 4567`,
`2125554567`. phonefmt scans text and rewrites whatever it finds into one
consistent format, either E.164 (`+12125554567`) or a readable national
format (`(212) 555-4567`), while leaving the rest of each line untouched.

It's a filter: it reads stdin, writes stdout, and does nothing else.

## Usage

```
phonefmt [--to e164|national] [--country <code>] [--count | --strip] < input.txt
some-command | phonefmt --to national
```

Example:

```
$ echo "call me at 212.555.4567 or (800) 456-7890" | phonefmt
call me at +12125554567 or +18004567890

$ echo "call me at 212.555.4567" | phonefmt --to national
call me at (212) 555-4567
```

Options:

- `--to e164|national` — output format. `e164` (the default) produces
  `+15551234567`. `national` produces `(555) 123-4567` for NANP numbers,
  a digit-grouped form (`1 23 45 67 89`) for the handful of other
  countries with a fixed national grouping, and falls back to E.164 for
  everything else.
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

A 10-digit run that resolves to a NANP number (country code `1`) is
further checked against NANPA's list of assigned area codes. A run with
the right shape but an area code nobody has been assigned — `555` is
the common case, since it's reserved for fictional use — is left alone
rather than treated as a phone number.

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

- NANP (US/Canada, `+1`) gets full national-format pretty-printing.
  A short list of other countries whose national format has one fixed
  digit grouping regardless of area or operator code — currently
  Russia/Kazakhstan, France, Spain, Poland, Brazil, China, and Turkey —
  also get grouped `--to national` output. Everything else is recognized
  well enough to split the country code from the subscriber number, but
  falls back to E.164 for `--to national` rather than guess at a shape
  that varies too much to pin down (the UK is the clearest example:
  area codes range from two to five digits, so no single grouping is
  right often enough to be worth printing).
- The numbering-plan table covers common calling codes, not the full
  ITU assignment list. An unrecognized code is passed through with
  punctuation stripped rather than split.
- Area codes are checked against NANPA's real assignment list, but
  exchange codes and subscriber numbers are not — any digits in those
  positions are accepted as long as the area code is real.
- The line-wrap join only looks one line ahead. A number split across
  more than two physical lines won't be reassembled.

## License

MIT, see [LICENSE](LICENSE).
