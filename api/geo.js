// Tells the first-visit redirect script which country the visitor is in,
// using the country header Vercel adds at the edge. No IP is stored or logged.
'use strict'

module.exports = function handler(req, res) {
  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify({ country: String(req.headers['x-vercel-ip-country'] || '').toUpperCase() }))
}
