// Order matters: more-specific patterns must come before less-specific ones.
// Each entry: [pattern, template]. Pattern is either an exact string or a RegExp.
const ROUTES = [
  // Template C — entity (with sub-path)
  [/^\/artist\/[^/]+/,    'C'],
  [/^\/album\/[^/]+/,     'C'],
  [/^\/playlist\/[^/]+/,  'C'],
  [/^\/play\/[^/]+/,      'C'],

  // Template B — verb-with-query (with sub-path)
  [/^\/queue\/.+/,        'B'],
  [/^\/control\/.+/,      'B'],
  [/^\/shuffle\/.+/,      'B'],
  [/^\/volume\/.+/,       'B'],
  [/^\/friend\/.+/,       'B'],

  // Template B — bare verbs
  ['/play',               'B'],
  ['/listen-along',       'B'],
  ['/import',             'B'],

  // Template A — generic (with optional sub-path)
  [/^\/library(\/.*)?$/,         'A'],
  [/^\/history(\/.*)?$/,         'A'],
  [/^\/recommendations(\/.*)?$/, 'A'],
  [/^\/settings(\/.*)?$/,        'A'],
  ['/home',                      'A'],
  ['/charts',                    'A'],
  ['/critics-picks',             'A'],
  ['/playlists',                 'A'],
  ['/search',                    'A'],
  ['/chat',                      'A'],
];

export function classifyPath(pathname) {
  for (const [pattern, template] of ROUTES) {
    if (typeof pattern === 'string') {
      if (pathname === pattern) return template;
    } else if (pattern.test(pathname)) {
      return template;
    }
  }
  return 'passthrough';
}
