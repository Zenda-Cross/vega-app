const LANGUAGE_MAP: Record<string, string> = {
  hin: 'Hindi',
  hi: 'Hindi',
  eng: 'English',
  en: 'English',
  twi: 'Twi',
  tw: 'Twi',
  jpn: 'Japanese',
  ja: 'Japanese',
  spa: 'Spanish',
  es: 'Spanish',
  fre: 'French',
  fra: 'French',
  fr: 'French',
  ger: 'German',
  deu: 'German',
  de: 'German',
  ita: 'Italian',
  it: 'Italian',
  kor: 'Korean',
  ko: 'Korean',
  chi: 'Chinese',
  zho: 'Chinese',
  zh: 'Chinese',
  rus: 'Russian',
  ru: 'Russian',
  por: 'Portuguese',
  pt: 'Portuguese',
  tam: 'Tamil',
  ta: 'Tamil',
  tel: 'Telugu',
  te: 'Telugu',
  mal: 'Malayalam',
  ml: 'Malayalam',
  kan: 'Kannada',
  kn: 'Kannada',
  ben: 'Bengali',
  bn: 'Bengali',
  pan: 'Punjabi',
  pa: 'Punjabi',
  mar: 'Marathi',
  mr: 'Marathi',
  guj: 'Gujarati',
  gu: 'Gujarati',
  urd: 'Urdu',
  ur: 'Urdu',
  ara: 'Arabic',
  ar: 'Arabic',
  ind: 'Indonesian',
  id: 'Indonesian',
  tha: 'Thai',
  th: 'Thai',
  vie: 'Vietnamese',
  vi: 'Vietnamese',
  tur: 'Turkish',
  tr: 'Turkish',
  sin: 'Sinhala',
  si: 'Sinhala',
  nep: 'Nepali',
  ne: 'Nepali',
  nld: 'Dutch',
  dut: 'Dutch',
  nl: 'Dutch',
  swe: 'Swedish',
  sv: 'Swedish',
  nor: 'Norwegian',
  no: 'Norwegian',
  dan: 'Danish',
  da: 'Danish',
  fin: 'Finnish',
  fi: 'Finnish',
  pol: 'Polish',
  pl: 'Polish',
  ces: 'Czech',
  cze: 'Czech',
  cs: 'Czech',
  ell: 'Greek',
  gre: 'Greek',
  el: 'Greek',
  heb: 'Hebrew',
  he: 'Hebrew',
  fas: 'Persian',
  per: 'Persian',
  fa: 'Persian',
  msa: 'Malay',
  may: 'Malay',
  ms: 'Malay',
  fil: 'Filipino',
  tgl: 'Tagalog',
  tl: 'Tagalog',
  ukr: 'Ukrainian',
  uk: 'Ukrainian',
  ron: 'Romanian',
  rum: 'Romanian',
  ro: 'Romanian',
  hun: 'Hungarian',
  hu: 'Hungarian',
};

/** Display only: keep the original language codes for track selection. */
export function languageLabel(language?: string, fallback = ''): string {
  const value = language?.trim();
  if (!value || ['und', 'unknown'].includes(value.toLowerCase()))
    return fallback;
  const code = value.toLowerCase().replace(/_/g, '-');
  if (LANGUAGE_MAP[code]) return LANGUAGE_MAP[code];
  const [base, ...variants] = code.split('-');
  if (LANGUAGE_MAP[base]) {
    return `${LANGUAGE_MAP[base]} (${variants.join('-').toUpperCase()})`;
  }
  // Capitalize custom names without changing the rest of the track label.
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function shortLanguageLabel(language?: string, fallback = ''): string {
  const full = languageLabel(language);
  if (!full) return fallback;
  const value = language!.trim();
  const match = Object.keys(LANGUAGE_MAP).find(
    code =>
      code.length === 2 &&
      LANGUAGE_MAP[code].toLowerCase() === value.toLowerCase(),
  );
  const short = match || value;
  return short.charAt(0).toUpperCase() + short.slice(1);
}
