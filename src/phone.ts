import { splitCountryCode, formatNationalNumber } from "./numbering-plan.js";
import { isAssignedAreaCode } from "./area-codes.js";

export interface FormatOptions {
  to: "e164" | "national";
  country: string;
}

// Runs of digits/spaces/dots/dashes/parens long enough to plausibly be a
// phone number. The actual digit-count check happens in formatNumber, this
// just keeps the regex from having to encode the numbering-plan rules.
const CANDIDATE = /(\+?\d[\d\s().-]{5,}\d)/g;

export function reformatLine(line: string, opts: FormatOptions): string {
  return line.replace(CANDIDATE, (match) => formatNumber(match, opts) ?? match);
}

// Counts candidates in the line that resolve to a real phone number, i.e.
// the same criteria reformatLine uses to decide what to rewrite. Digit runs
// that fail formatNumber's checks (wrong length, unresolvable country) don't
// count, so this matches what --to would actually have rewritten.
export function countMatches(line: string, opts: FormatOptions): number {
  let count = 0;
  for (const match of line.matchAll(CANDIDATE)) {
    if (formatNumber(match[0], opts) !== null) count++;
  }
  return count;
}

// Returns the reformatted number, or null if the match doesn't have a
// digit count that corresponds to a real phone number.
export function formatNumber(raw: string, opts: FormatOptions): string | null {
  const hasPlus = raw.trim().startsWith("+");
  const digits = raw.replace(/\D/g, "");

  if (digits.length < 7 || digits.length > 15) return null;

  let countryCode: string;
  let subscriber: string;

  if (digits.length === 11 && digits.startsWith("1")) {
    // NANP number with an explicit leading 1, with or without a "+"
    countryCode = "1";
    subscriber = digits.slice(1);
  } else if (!hasPlus && digits.length === 10) {
    // bare 10-digit number, assume the configured default country
    countryCode = opts.country;
    subscriber = digits;
  } else if (hasPlus) {
    const split = splitCountryCode(digits);
    if (split === null) {
      // calling code not in the numbering-plan table: we can't know
      // where the country code ends, so treat the whole thing as
      // opaque and only strip formatting punctuation
      return `+${digits}`;
    }
    countryCode = split.countryCode;
    subscriber = split.subscriber;
  } else {
    return null;
  }

  // NANP numbers carry a real area code (NPA); a 10-digit run with the
  // right shape but an area code nobody has been assigned (555, most
  // unassigned N9X codes, etc.) isn't a phone number.
  if (countryCode === "1" && subscriber.length === 10 && !isAssignedAreaCode(subscriber.slice(0, 3))) {
    return null;
  }

  if (opts.to === "e164") {
    return `+${countryCode}${subscriber}`;
  }

  // national: NANP gets its familiar parens-and-dash treatment. Checking
  // countryCode (not just subscriber.length) matters now that other
  // numbering plans can also produce a 10-digit subscriber.
  if (countryCode === "1" && subscriber.length === 10) {
    const area = subscriber.slice(0, 3);
    const exchange = subscriber.slice(3, 6);
    const lineNumber = subscriber.slice(6);
    return `(${area}) ${exchange}-${lineNumber}`;
  }

  // Everything else uses the digit-grouping table if this calling code
  // has one, and falls back to E.164 if it doesn't rather than guessing
  // at a shape that might not fit.
  const national = formatNationalNumber(countryCode, subscriber);
  if (national !== null) return national;

  return `+${countryCode}${subscriber}`;
}

// Removes recognized phone numbers from the line instead of reformatting
// them. Uses the same recognition criteria as reformatLine, so a digit run
// that reformatLine would leave alone (wrong length, unresolvable country)
// is left alone here too. Surrounding whitespace and punctuation are not
// collapsed, since guessing which of them belonged to the number would be
// wrong as often as right.
export function stripLine(line: string, opts: FormatOptions): string {
  return line.replace(CANDIDATE, (match) => (formatNumber(match, opts) !== null ? "" : match));
}

// Finds the candidate match that runs right up to the end of the line, if
// any. A number that got wrapped by whatever produced the text (a terminal,
// a log formatter, a text editor) always breaks with the tail digits
// touching the line end, since there's no trailing punctuation or word left
// to wrap after them.
function trailingCandidate(line: string): string | null {
  if (!/\d$/.test(line)) return null;
  let last: string | null = null;
  for (const match of line.matchAll(CANDIDATE)) {
    if (match.index !== undefined && match.index + match[0].length === line.length) {
      last = match[0];
    }
  }
  return last;
}

// A candidate match is only ever a *prefix* of what follows a line break,
// since the wrap could have happened anywhere inside the number. This finds
// the longest such prefix, trimmed back to end on a digit so it lines up
// with what CANDIDATE itself would ever match.
function leadingCandidate(line: string): string | null {
  const run = /^[\d\s().-]+/.exec(line);
  if (run === null) return null;
  const trimmed = /\d(?=\D*$)/.exec(run[0]);
  return trimmed === null ? null : run[0].slice(0, trimmed.index + 1);
}

// Decides whether prevLine ends mid-number and nextLine picks it back up,
// i.e. whether the two lines should be joined before formatting instead of
// being formatted independently. Only fires when the tail fragment isn't
// already a complete number on its own (otherwise two adjacent numbers on
// consecutive lines would get merged into one) and the join actually
// produces something formatNumber recognizes.
export function isWrappedAcrossLines(
  prevLine: string,
  nextLine: string,
  opts: FormatOptions
): boolean {
  const tail = trailingCandidate(prevLine);
  if (tail === null || formatNumber(tail, opts) !== null) return false;

  const head = leadingCandidate(nextLine);
  if (head === null) return false;

  return formatNumber(tail + head, opts) !== null;
}
