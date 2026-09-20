// NANP exchange codes (NXX, the middle three digits of a 10-digit number)
// don't have a public per-area-code assignment list the way area codes do -
// which carrier holds which exchange in which NPA is operational data the
// telcos keep, not something published in a form a hobby project can vendor
// and keep current. What the plan does publish, in the NANP dialing rules
// themselves, are structural constraints true for every exchange code and
// every line number regardless of who's assigned it. Checking those catches
// most made-up numbers (sequential test data, "555" placeholders, N11
// service codes typed into the wrong field) without pretending to have real
// per-carrier assignment data.

// N11 codes are reserved for service numbers (211 emergency non-police,
// 311 city services, 411 directory assistance, 511 traffic, 611 repair,
// 711 relay, 811 utility locate, 911 emergency) and can never be an
// exchange code - dialing one always routes to the service, not a
// subscriber line.
const N11_CODES: ReadonlySet<string> = new Set([
  "211", "311", "411", "511", "611", "711", "811", "911",
]);

// Exchange codes, like area codes, must start with 2-9. A leading 0 or 1
// is reserved for operator access and long-distance trunk prefixes and was
// never assignable as the first digit of a subscriber exchange.
export function isValidExchange(exchange: string): boolean {
  if (exchange[0] === "0" || exchange[0] === "1") return false;
  return !N11_CODES.has(exchange);
}

// Within the 555 exchange, only line numbers 0100-0199 are reserved for
// fictional use in film, TV, and sample code; the rest of 555 - including
// 555-1212 directory assistance - is in real use. Generated or placeholder
// numbers overwhelmingly land in the reserved block, so this catches those
// without treating every 555 number as fake.
export function isFictionalLineNumber(exchange: string, lineNumber: string): boolean {
  return exchange === "555" && lineNumber >= "0100" && lineNumber <= "0199";
}
