export function reconstructDeepLink(url) {
  const pathAndQuery = url.pathname.replace(/^\//, '') + url.search;
  return `parachord://${pathAndQuery}`;
}
