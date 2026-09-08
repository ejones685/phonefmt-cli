// NANPA's assigned Numbering Plan Areas (area codes) for the United
// States, Canada, and the Caribbean member countries and territories
// that share the North American Numbering Plan.
//
// A 10-digit run can have the exact shape of a NANP number and still
// not be one - incremented test data, mangled OCR output, and made-up
// examples routinely produce area codes nobody has ever been assigned
// (555 is the classic case: reserved for fiction, never handed out as
// an NPA). Checking against the real assignment list catches those.
//
// This is current as of NANPA's public assignment records at the time
// it was written. NANPA activates new area codes periodically; one
// that goes live after this list was last updated won't be recognized
// until the list is refreshed.
const NANP_AREA_CODES: ReadonlySet<string> = new Set([
  // Alabama
  "205", "251", "256", "334", "938",
  // Alaska
  "907",
  // Arizona
  "480", "520", "602", "623", "928",
  // Arkansas
  "479", "501", "870",
  // California
  "209", "213", "279", "310", "323", "341", "408", "415", "424", "442",
  "510", "530", "559", "562", "619", "626", "628", "650", "657", "661",
  "669", "707", "714", "747", "760", "805", "818", "820", "831", "858",
  "909", "916", "925", "949", "951",
  // Colorado
  "303", "719", "720", "970", "983",
  // Connecticut
  "203", "475", "860", "959",
  // Delaware
  "302",
  // Florida
  "239", "305", "321", "352", "386", "407", "561", "645", "656", "689",
  "727", "754", "772", "786", "813", "850", "863", "904", "941", "954",
  // Georgia
  "229", "404", "470", "478", "678", "706", "762", "770", "912", "943",
  // Hawaii
  "808",
  // Idaho
  "208", "986",
  // Illinois
  "217", "224", "309", "312", "331", "447", "464", "618", "630", "708",
  "730", "773", "779", "815", "847", "872",
  // Indiana
  "219", "260", "317", "463", "574", "765", "812", "930",
  // Iowa
  "319", "515", "563", "641", "712",
  // Kansas
  "316", "620", "785", "913",
  // Kentucky
  "270", "364", "502", "606", "859",
  // Louisiana
  "225", "318", "337", "504", "985",
  // Maine
  "207",
  // Maryland
  "227", "240", "301", "410", "443", "667",
  // Massachusetts
  "339", "351", "413", "508", "617", "774", "781", "857", "978",
  // Michigan
  "231", "248", "269", "313", "517", "586", "616", "679", "734", "810",
  "906", "947", "989",
  // Minnesota
  "218", "320", "507", "612", "651", "763", "952",
  // Mississippi
  "228", "601", "662", "769",
  // Missouri
  "314", "417", "573", "636", "660", "816", "975",
  // Montana
  "406",
  // Nebraska
  "308", "402", "531",
  // Nevada
  "702", "725", "775",
  // New Hampshire
  "603",
  // New Jersey
  "201", "551", "609", "640", "732", "848", "856", "862", "908", "973",
  // New Mexico
  "505", "575",
  // New York
  "212", "315", "326", "329", "332", "347", "516", "518", "585", "607",
  "631", "646", "680", "716", "718", "838", "845", "914", "917", "929",
  "934",
  // North Carolina
  "252", "336", "704", "743", "828", "910", "919", "980", "984",
  // North Dakota
  "701",
  // Ohio
  "216", "220", "234", "330", "380", "419", "440", "513", "567", "614",
  "740", "937",
  // Oklahoma
  "405", "539", "580", "918",
  // Oregon
  "458", "503", "541", "971",
  // Pennsylvania
  "215", "223", "267", "272", "412", "445", "484", "570", "610", "717",
  "724", "814", "878",
  // Rhode Island
  "401",
  // South Carolina
  "803", "839", "843", "854", "864",
  // South Dakota
  "605",
  // Tennessee
  "423", "615", "629", "731", "865", "901", "931",
  // Texas
  "210", "214", "254", "281", "325", "346", "361", "409", "430", "432",
  "469", "512", "682", "713", "726", "737", "806", "817", "830", "832",
  "903", "915", "936", "940", "945", "956", "972", "979",
  // Utah
  "385", "435", "801",
  // Vermont
  "802",
  // Virginia
  "276", "434", "540", "571", "703", "757", "804", "826", "948",
  // Washington
  "206", "253", "360", "425", "509", "564",
  // Washington, D.C.
  "202", "771",
  // West Virginia
  "304", "681",
  // Wisconsin
  "262", "274", "414", "534", "608", "715", "920",
  // Wyoming
  "307",
  // U.S. territories: Puerto Rico, USVI, Guam, American Samoa, N. Mariana Is.
  "787", "939", "340", "671", "684", "670",
  // Canada: Alberta
  "403", "587", "780", "825",
  // Canada: British Columbia
  "236", "250", "604", "672", "778",
  // Canada: Manitoba
  "204", "431",
  // Canada: New Brunswick
  "428", "506",
  // Canada: Newfoundland and Labrador
  "709",
  // Canada: Northwest Territories, Nunavut, Yukon (shared)
  "867",
  // Canada: Nova Scotia, Prince Edward Island (shared)
  "782", "902",
  // Canada: Ontario
  "226", "249", "289", "343", "365", "382", "416", "437", "519", "548",
  "613", "647", "683", "705", "807", "905",
  // Canada: Quebec
  "263", "354", "367", "418", "438", "450", "468", "514", "579", "581",
  "819", "873",
  // Canada: Saskatchewan
  "306", "639",
  // Caribbean NANP members
  "264", "268", "242", "246", "441", "284", "345", "767", "809", "829",
  "849", "473", "658", "876", "664", "869", "758", "784", "721", "868",
  "649",
  // Non-geographic: personal comms, toll-free, premium
  "500", "800", "833", "844", "855", "866", "877", "888", "900",
]);

export function isAssignedAreaCode(areaCode: string): boolean {
  return NANP_AREA_CODES.has(areaCode);
}
