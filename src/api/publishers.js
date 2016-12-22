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

const PUBLISHERS_DAILY = `
SELECT
  TO_CHAR(ymd, 'YYYY-MM-DD') AS ymd,
  total,
  verified,
  address,
  irs
FROM dw.fc_daily_publishers
WHERE ymd >= GREATEST(current_date - CAST($1 as INTERVAL), '2016-09-01'::date)
ORDER BY ymd
`

// Return an array containing a day offset i.e. ['3 days']
const commonDaysParamsBuilder = (request) => {
  return [parseInt(request.query.days || 7) + ' days']
}

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

  server.route({
    method: 'GET',
    path: '/api/1/publishers/daily',
    handler: common.buildQueryReponseHandler(
      client,
      PUBLISHERS_DAILY,
      (reply, results, request) => {
        var rows = _.map(results.rows, (row) => {
          _.keys(row).forEach((k) => {
            if (k !== 'ymd') {
              row[k] = parseFloat(row[k])
            }
          })
          return row
        })
        reply(rows)
      },
      commonDaysParamsBuilder
    )
  })
}
