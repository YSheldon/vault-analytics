/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var _ = require('underscore')
var assert = require('assert')
var moment = require('moment')

const JOB_STATUS = `
SELECT run_id, ts, id, duration
FROM dtl.runinfo RI
WHERE
  ts = ( SELECT MAX(ts) FROM dtl.runinfo WHERE id = RI.id )
`

exports.setup = (server, client, mongo) => {
  server.route({
    method: 'GET',
    path: '/api/1/job_status',
    handler: function (request, reply) {
      var jobName = null
      client.query(JOB_STATUS, [], (err, results) => {
        if (err) {
          reply(err.toString()).code(500)
        } else {
          var rows = results.rows.map((row) => {
            row.ago = moment(row.ts).fromNow()
            row.duration = parseFloat(row.duration || 0)
            return row
          })
          reply(rows)
        }
      })
    }
  })
}
