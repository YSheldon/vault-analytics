/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var common = require('./common')
var _ = require('underscore')

const PUBLISHERS_OVERVIEW = `
SELECT
  (select count(1) from dtl.publishers) as total, 
  (select count(1) from dtl.publishers where verified) as verified,
  (select count(1) from dtl.publishers where verified) / (select count(1) from dtl.publishers) as verified_per, 
  (select count(1) from dtl.publishers where authorized) as authorized,
  (select count(1) from dtl.publishers where authorized) / (select count(1) from dtl.publishers) as authorized_per
`

const PUBLISHERS_DAILY = `
SELECT
  TO_CHAR(ymd, 'YYYY-MM-DD') AS ymd,
  total,
  verified,
  authorized,
  irs
FROM dw.fc_daily_publishers
WHERE ymd >= GREATEST(current_date - CAST($1 as INTERVAL), '2016-09-01'::date)
ORDER BY ymd
`

// Return an array containing a day offset i.e. ['3 days']
const commonDaysParamsBuilder = (request) => {
  return [parseInt(request.query.days || 7) + ' days']
}

const emptyParamsBuilder = (request) => {
  return []
}

const PUBLISHERS_BUCKETED = 'SELECT * FROM (' + [7, 14, 30, 60, 120].map((days) => {
  return `
SELECT
  ${days} as days,
  sum(total) as total,
  sum(verified) as verified,
  sum(authorized) as authorized,
  sum(irs) as irs
FROM dw.fc_daily_publishers
WHERE ymd >= current_date - CAST('${days} days' as INTERVAL)`
}).join(' UNION ') + ') T ORDER BY T.days ASC'

const PUBLISHERS_DETAILS = `
SELECT * FROM dtl.publishers WHERE verified ORDER BY COALESCE(alexa_rank, audience, 0) DESC 
`

const PUBLISHER_PLATFORMS = `
SELECT * FROM dtl.publisher_platforms ORDER BY ord ASC
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

  server.route({
    method: 'GET',
    path: '/api/1/publishers/overview/bucketed',
    handler: common.buildQueryReponseHandler(
      client,
      PUBLISHERS_BUCKETED,
      (reply, results, request) => {
        var rows = _.map(results.rows, (row) => {
          _.keys(row).forEach((k) => {
            row[k] = parseFloat(row[k])
          })
          return row
        })
        reply(rows)
      },
      emptyParamsBuilder
    )
  })

  server.route({
    method: 'GET',
    path: '/api/1/publishers/details',
    handler: common.buildQueryReponseHandler(
      client,
      PUBLISHERS_DETAILS,
      (reply, results, request) => {
        reply(results.rows)
      },
      emptyParamsBuilder
    )
  })

  server.route({
    method: 'GET',
    path: '/api/1/publishers/platforms',
    handler: common.buildQueryReponseHandler(
      client,
      PUBLISHER_PLATFORMS,
      (reply, results, request) => {
        reply(results.rows)
      },
      emptyParamsBuilder
    )
  })

}
