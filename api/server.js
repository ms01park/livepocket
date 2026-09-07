'use strict';

const handleRequest = require('../server');

module.exports = (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const queryPath = req.query && req.query.path;
  const forwardedPath = Array.isArray(queryPath)
    ? queryPath.join('/')
    : queryPath || url.searchParams.get('path');
  if (forwardedPath) req.url = `/api/${String(forwardedPath).replace(/^\/+/, '')}`;
  return handleRequest(req, res);
};
