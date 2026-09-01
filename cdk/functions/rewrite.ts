import { ROOT_DOMAIN } from "../lib/config";

/**
 * Builds the viewer-request function for a distribution.
 *
 * CloudFront Functions run a restricted JS 2.0 runtime: no async, no network,
 * and a sub-millisecond budget. The source is assembled per stage so dev gets
 * only the rewrite and never carries a redirect it has no use for.
 */
export function rewriteFunctionCode(redirectToApex: boolean): string {
  // The redirect has to return *before* the rewrite below runs. Rewriting
  // first would put the resolved object key in the Location header, so
  // `www.ledger-1.com/mortgage/` would send visitors — and search engines —
  // to `/mortgage/index.html` instead of `/mortgage/`.
  const redirect = redirectToApex
    ? `
  var host = request.headers.host && request.headers.host.value;
  if (host && host !== '${ROOT_DOMAIN}') {
    var query = '';
    for (var name in request.querystring) {
      var value = request.querystring[name].value;
      query += (query ? '&' : '?') + name + (value ? '=' + value : '');
    }
    return {
      statusCode: 301,
      statusDescription: 'Moved Permanently',
      headers: {
        location: { value: 'https://${ROOT_DOMAIN}' + uri + query },
      },
    };
  }
`
    : "";

  return `function handler(event) {
  var request = event.request;
  var uri = request.uri;
${redirect}
  // The S3 REST origin serves objects by exact key and has no notion of a
  // directory index, so map the trailing-slash routes the export emits
  // (\`/mortgage/\`) onto the real object key (\`/mortgage/index.html\`).
  if (uri.endsWith('/')) {
    request.uri = uri + 'index.html';
  } else if (!uri.includes('.')) {
    // A route hit without its trailing slash still needs to land on the file.
    request.uri = uri + '/index.html';
  }

  return request;
}`;
}
