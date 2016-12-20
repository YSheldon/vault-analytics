/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var common = require('./common')
var _ = require('underscore')

const PUBLISHERS_OVERVIEW = `
SELECT
  SUM(total) AS total,
  SUM(verified) AS verified,
  SUM(verified) / SUM(total) AS verified_per,
  SUM(address) AS address,
  SUM(address) / SUM(total) AS address_per,
  SUM(irs) AS irs,
  SUM(irs) / SUM(total) AS irs_per
FROM dw.fc_daily_publishers
`

// Endpoint definitions
exports.setup = (server, client, mongo) => {
  // Publishers overview
  server.route({
    method: 'GET',
    path: '/api/1/publishers/overview',
    handler: common.buildQueryReponseHandler(
      client,
      PUBLISHERS_OVERVIEW,
      (reply, results, request) => {
        var row = results.rows[0]
        _.keys(row).forEach((k) => {
          row[k] = parseFloat(row[k])
        })
        reply(row)
      },
      (request) => { return [] }
    )
  })
}
