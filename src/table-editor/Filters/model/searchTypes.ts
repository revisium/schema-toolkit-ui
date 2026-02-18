export enum SearchLanguage {
  Arabic = 'arabic',
  Armenian = 'armenian',
  Basque = 'basque',
  Catalan = 'catalan',
  Danish = 'danish',
  Dutch = 'dutch',
  English = 'english',
  Finnish = 'finnish',
  French = 'french',
  German = 'german',
  Greek = 'greek',
  Hindi = 'hindi',
  Hungarian = 'hungarian',
  Indonesian = 'indonesian',
  Irish = 'irish',
  Italian = 'italian',
  Lithuanian = 'lithuanian',
  Nepali = 'nepali',
  Norwegian = 'norwegian',
  Portuguese = 'portuguese',
  Romanian = 'romanian',
  Russian = 'russian',
  Serbian = 'serbian',
  Simple = 'simple',
  Spanish = 'spanish',
  Swedish = 'swedish',
  Tamil = 'tamil',
  Turkish = 'turkish',
  Yiddish = 'yiddish',
}

export enum SearchType {
  Plain = 'plain',
  Phrase = 'phrase',
  Prefix = 'prefix',
  Tsquery = 'tsquery',
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export const SEARCH_LANGUAGES: readonly {
  value: SearchLanguage;
  label: string;
}[] = Object.values(SearchLanguage).map((value) => ({
  value,
  label:
    value === SearchLanguage.Simple
      ? 'Simple (no stemming)'
      : capitalize(value),
}));

export const SEARCH_TYPES: readonly { value: SearchType; label: string }[] = [
  { value: SearchType.Plain, label: 'Words (any order)' },
  { value: SearchType.Phrase, label: 'Exact phrase' },
  { value: SearchType.Prefix, label: 'Partial words' },
  { value: SearchType.Tsquery, label: 'Raw tsquery' },
];
