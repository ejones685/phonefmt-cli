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
    // unknown numbering plan: without a full prefix table we can't know
    // where the country code ends, so treat the whole thing as opaque
    // and only strip formatting punctuation
    return `+${digits}`;
  } else {
    return null;
  }

  if (opts.to === "e164") {
    return `+${countryCode}${subscriber}`;
  }

  // national: only know how to pretty-print 10-digit NANP subscriber
  // numbers; anything else falls back to E.164 rather than guessing
  if (subscriber.length === 10) {
    const area = subscriber.slice(0, 3);
    const exchange = subscriber.slice(3, 6);
    const lineNumber = subscriber.slice(6);
    return `(${area}) ${exchange}-${lineNumber}`;
  }

  return `+${countryCode}${subscriber}`;
}
