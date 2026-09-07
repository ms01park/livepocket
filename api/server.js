'use strict';

const handleRequest = require('../server');

module.exports = (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const forwardedPath = url.searchParams.get('path');
  if (forwardedPath) req.url = `/api/${forwardedPath}`;
  return handleRequest(req, res);
};
