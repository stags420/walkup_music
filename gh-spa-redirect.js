// Single Page Apps for GitHub Pages (reverse redirect)
// See: https://github.com/rafgraph/spa-github-pages
(function (l) {
  if (l.search && l.search[1] === '/') {
    var decoded = l.search
      .slice(1)
      .split('&')
      .map(function (s) {
        return s.replaceAll('~and~', '&');
      })
      .join('?');
    globalThis.history.replaceState(undefined, undefined, l.pathname.slice(0, -1) + decoded + l.hash);
  }
})(globalThis.location);


