// ITU-T E.164 calling codes, mapped to the national significant number
// (NSN) lengths in use for that code. Lengths vary by country because
// numbering plans differ; where a country allows more than one NSN
// length (open vs. closed numbering, mixed mobile/fixed schemes) all
// observed lengths are listed. NANP ("1") is handled separately in
// phone.ts since it has its own well-known 10-digit format.
//
// This is a simplified plan: it is accurate enough to find the
// boundary between calling code and subscriber number for E.164-style
// input, but it does not attempt per-country area-code or trunk-prefix
// rules the way a full numbering-plan database would.
const NUMBERING_PLAN: ReadonlyMap<string, readonly number[]> = new Map([
  ["7", [10]], // Russia, Kazakhstan
  ["20", [9, 10]], // Egypt
  ["27", [9]], // South Africa
  ["30", [10]], // Greece
  ["31", [9]], // Netherlands
  ["32", [8, 9]], // Belgium
  ["33", [9]], // France
  ["34", [9]], // Spain
  ["36", [8, 9]], // Hungary
  ["39", [9, 10]], // Italy
  ["40", [9]], // Romania
  ["41", [9]], // Switzerland
  ["43", [10, 11]], // Austria
  ["44", [10]], // United Kingdom
  ["45", [8]], // Denmark
  ["46", [7, 8, 9]], // Sweden
  ["47", [8]], // Norway
  ["48", [9]], // Poland
  ["49", [10, 11]], // Germany
  ["51", [9]], // Peru
  ["52", [10]], // Mexico
  ["54", [10]], // Argentina
  ["55", [10, 11]], // Brazil
  ["56", [9]], // Chile
  ["57", [10]], // Colombia
  ["58", [10]], // Venezuela
  ["60", [9, 10]], // Malaysia
  ["61", [9]], // Australia
  ["62", [9, 10, 11]], // Indonesia
  ["63", [10]], // Philippines
  ["64", [8, 9]], // New Zealand
  ["65", [8]], // Singapore
  ["66", [9]], // Thailand
  ["81", [10]], // Japan
  ["82", [9, 10]], // South Korea
  ["84", [9, 10]], // Vietnam
  ["86", [11]], // China
  ["90", [10]], // Turkey
  ["91", [10]], // India
  ["92", [10]], // Pakistan
  ["93", [9]], // Afghanistan
  ["94", [9]], // Sri Lanka
  ["95", [8, 9, 10]], // Myanmar
  ["98", [10]], // Iran
  ["211", [9]], // South Sudan
  ["212", [9]], // Morocco
  ["213", [9]], // Algeria
  ["216", [8]], // Tunisia
  ["218", [9]], // Libya
  ["220", [7]], // Gambia
  ["221", [9]], // Senegal
  ["234", [10]], // Nigeria
  ["254", [9]], // Kenya
  ["255", [9]], // Tanzania
  ["256", [9]], // Uganda
  ["351", [9]], // Portugal
  ["352", [9]], // Luxembourg
  ["353", [9]], // Ireland
  ["354", [7]], // Iceland
  ["358", [9, 10]], // Finland
  ["359", [8, 9]], // Bulgaria
  ["370", [8]], // Lithuania
  ["371", [8]], // Latvia
  ["372", [7, 8]], // Estonia
  ["380", [9]], // Ukraine
  ["420", [9]], // Czech Republic
  ["421", [9]], // Slovakia
  ["852", [8]], // Hong Kong
  ["853", [8]], // Macau
  ["886", [9]], // Taiwan
  ["966", [9]], // Saudi Arabia
  ["971", [9]], // United Arab Emirates
  ["972", [9]], // Israel
  ["974", [8]], // Qatar
  ["977", [9, 10]], // Nepal
  ["998", [9]], // Uzbekistan
]);

// Longest calling codes are tried first so a real 3-digit code (e.g.
// "212") isn't mistaken for a 1-digit prefix that happens to also be
// a key in the table.
const CODE_LENGTHS = [3, 2, 1];

// Digit-grouping patterns for countries where the national format has a
// single, well-known shape regardless of which area or operator code the
// subscriber number starts with. Keyed by calling code, then NSN length,
// since a few of these (Brazil) use a different grouping for their two
// lengths. Countries left out of this table (the UK is the clearest case)
// don't have one fixed shape - area code length varies enough that a
// single pattern would misformat plenty of real numbers - so they stay on
// the E.164 fallback rather than risk printing something wrong.
const NATIONAL_FORMATS: ReadonlyMap<string, ReadonlyMap<number, readonly number[]>> = new Map([
  ["7", new Map([[10, [3, 3, 2, 2]]])], // Russia, Kazakhstan: 912 345 67 89
  ["33", new Map([[9, [1, 2, 2, 2, 2]]])], // France: 1 23 45 67 89
  ["34", new Map([[9, [3, 3, 3]]])], // Spain: 123 456 789
  ["48", new Map([[9, [3, 3, 3]]])], // Poland: 123 456 789
  ["55", new Map([[10, [2, 4, 4]], [11, [2, 5, 4]]])], // Brazil: landline / mobile
  ["86", new Map([[11, [3, 4, 4]]])], // China: mobile, 138 1234 5678
  ["90", new Map([[10, [3, 3, 2, 2]]])], // Turkey: 532 123 45 67
]);

// Groups a subscriber number for display using the pattern above, or
// returns null if this calling code/length combination has no known
// pattern - the caller's signal to fall back to E.164 instead of guessing.
export function formatNationalNumber(countryCode: string, subscriber: string): string | null {
  const groups = NATIONAL_FORMATS.get(countryCode)?.get(subscriber.length);
  if (!groups) return null;

  const parts: string[] = [];
  let index = 0;
  for (const size of groups) {
    parts.push(subscriber.slice(index, index + size));
    index += size;
  }
  return parts.join(" ");
}

export interface CountrySplit {
  countryCode: string;
  subscriber: string;
}

// Splits a digit-only string (no leading "+") into calling code and
// subscriber number using the numbering-plan table above. Returns null
// if no known calling code has an NSN length matching the remainder,
// which is the caller's signal to leave the number unsplit.
export function splitCountryCode(digits: string): CountrySplit | null {
  for (const length of CODE_LENGTHS) {
    const countryCode = digits.slice(0, length);
    const nsnLengths = NUMBERING_PLAN.get(countryCode);
    if (!nsnLengths) continue;

    const subscriber = digits.slice(length);
    if (nsnLengths.includes(subscriber.length)) {
      return { countryCode, subscriber };
    }
  }
  return null;
}
