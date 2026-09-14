// Netlify Functions bazi ortamlarda Web Request, bazilarinda Lambda event gonderir.
// serverless-http yalnizca Lambda formatini anlar — burada normalize ediyoruz.

const isWebRequest = (event) =>
  Boolean(
    event &&
      typeof event === 'object' &&
      typeof event.url === 'string' &&
      typeof event.method === 'string'
  );

const headersToObject = (headers) => {
  const out = {};
  if (!headers) return out;
  if (typeof headers.forEach === 'function') {
    headers.forEach((v, k) => {
      out[k] = v;
    });
    return out;
  }
  return { ...headers };
};

const queryFromUrl = (url) => {
  const qsp = {};
  url.searchParams.forEach((v, k) => {
    qsp[k] = v;
  });
  return Object.keys(qsp).length ? qsp : null;
};

// Web Request -> Lambda event (serverless-http uyumlu)
export const toLambdaEvent = async (req) => {
  const url = new URL(req.url);
  let body = null;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    body = await req.text();
  }
  return {
    httpMethod: req.method,
    path: url.pathname || '/',
    headers: headersToObject(req.headers),
    queryStringParameters: queryFromUrl(url),
    body: body || null,
    isBase64Encoded: false,
    rawUrl: req.url,
  };
};

// Lambda event'te eksik path/rawUrl duzelt
export const normalizeLambdaEvent = (event) => {
  const copy = { ...event, headers: headersToObject(event.headers) };
  if (!copy.path) {
    if (copy.rawUrl) {
      try {
        copy.path = new URL(copy.rawUrl).pathname;
      } catch {
        copy.path = '/';
      }
    } else {
      copy.path = '/';
    }
  }
  if (!copy.httpMethod) copy.httpMethod = 'GET';
  if (copy.queryStringParameters === undefined) copy.queryStringParameters = null;
  return copy;
};

export const prepareEvent = async (event) => {
  if (isWebRequest(event)) return toLambdaEvent(event);
  return normalizeLambdaEvent(event || {});
};
