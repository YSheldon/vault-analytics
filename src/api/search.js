/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var _ = require('underscore')

var tokenize = function (text) {
  return text.split(/\s+/)
}

const SEARCH = `
SELECT
  *,
  ARRAY(SELECT tag FROM dtl.crash_tags CT WHERE CR.id = CT.crash_id) AS tags
FROM dtl.crashes CR WHERE contents->>'crash_id' = $1 OR id IN ( select object_id from (
  SELECT
  object_id,
  object_type,
  ts_rank(searchable, tsquery($1::text)) AS rank
FROM dtl.fti
  WHERE searchable @@ tsquery($1::text)
ORDER BY rank DESC
) S ) order by contents->'ts' DESC
LIMIT 100
`

// Data endpoints
exports.setup = (server, client, mongo) => {
  server.route({
    method: 'GET',
    path: '/api/1/search',
    handler: function (request, reply) {
      var q = tokenize(request.query.query).join('|')
      client.query(SEARCH, [q], (err, results) => {
        if (err) {
          console.log(err)
          reply(err.toString).code(500)
        } else {
          var rowCount = results.rows.length
          results.row = results.rows.slice(0, 100)
          reply({
            crashes: results.rows,
            start: 0,
            limit: 100,
            rowCount: rowCount
          })
        }
      })
    }
  })
}
