'use strict';

const handleRequest = require('../server');

module.exports = (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const queryPath = req.query && req.query.path;
  const forwardedPath = Array.isArray(queryPath)
    ? queryPath.join('/')
    : queryPath || url.searchParams.get('path');
  if (forwardedPath) {
    const forwardedUrl = new URL(`/api/${String(forwardedPath).replace(/^\/+/, '')}`, 'http://localhost');
    for (const [key, value] of url.searchParams) if (key !== 'path') forwardedUrl.searchParams.append(key, value);
    for (const [key, value] of Object.entries(req.query || {})) {
      if (key === 'path' || forwardedUrl.searchParams.has(key)) continue;
      for (const item of Array.isArray(value) ? value : [value]) if (item != null) forwardedUrl.searchParams.append(key, String(item));
    }
    req.url = `${forwardedUrl.pathname}${forwardedUrl.search}`;
  }
  return handleRequest(req, res);
};
