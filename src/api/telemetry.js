/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var _ = require('underscore')
var common = require('./common')

const CI_MEASURES = `
SELECT measure FROM dw.fc_daily_telemetry GROUP BY measure ORDER BY measure
`

const CI_MACHINES = `
SELECT machine FROM dw.fc_daily_telemetry GROUP BY machine ORDER BY machine
`

const CI_VERSIONS = `
SELECT version FROM dw.fc_daily_telemetry GROUP BY version ORDER BY version
`

const TELEMETRY = `
SELECT
  TO_CHAR(ymd, 'YYYY-MM-DD') AS ymd,
  platform,
  version,
  channel,
  measure,
  machine,
  minimum,
  quant25,
  average,
  quant75,
  maximum,
  stddev,
  samples
FROM dw.fc_daily_telemetry
WHERE
  ymd >= current_date - CAST($1 as INTERVAL) AND
  platform = ANY ($2) AND
  channel = ANY ($3) AND
  ($4::text IS NULL OR version = $4::text) AND
  ($5::text IS NULL OR measure = $5::text) AND
  ($6::text IS NULL OR machine = $6::text)
ORDER BY
  ymd,
  platform,
  channel,
  machine,
  measure
`

// Return an array containing a day offset i.e. ['3 days']
const commonDaysParamsBuilder = (request) => {
  return [parseInt(request.query.days || 7) + ' days']
}

// Default success handler
const commonSuccessHandler = (reply, results, request) => {
  results.rows.forEach((row) => row.count = parseFloat(row.count))
  results.rows = common.potentiallyFilterToday(
    results.rows,
    request.query.showToday === 'true'
  )
  reply(results.rows)
}

// Endpoint definitions
exports.setup = (server, client, mongo) => {
  // Measures
  server.route({
    method: 'GET',
    path: '/api/1/ci/measures',
    handler: common.buildQueryReponseHandler(
      client,
      CI_MEASURES,
      function(reply, results, request) {
        reply(_.pluck(results.rows, 'measure'))
      },
      function(request) { return [] }
    )
  })

  // Machines
  server.route({
    method: 'GET',
    path: '/api/1/ci/machines',
    handler: common.buildQueryReponseHandler(
      client,
      CI_MACHINES,
      function(reply, results, request) {
        reply(_.pluck(results.rows, 'machine'))
      },
      function(request) { return [] }
    )
  })

  // Versions
  server.route({
    method: 'GET',
    path: '/api/1/ci/versions',
    handler: common.buildQueryReponseHandler(
      client,
      CI_VERSIONS,
      function(reply, results, request) {
        reply(_.pluck(results.rows, 'version'))
      },
      function(request) { return [] }
    )
  })

  // Telemetry
  server.route({
    method: 'GET',
    path: '/api/1/ci/telemetry',
    handler: (request, reply) => {
      let days = parseInt(request.query.days || 14, 10) + ' days'
      let platforms = common.platformPostgresArray(request.query.platformFilter)
      let channels = common.channelPostgresArray(request.query.channelFilter)
      let version = request.query.version || null
      let measure = request.query.measure || null
      let machine = request.query.machine || null
      client.query(TELEMETRY, [days, platforms, channels, version, measure, machine], (err, results) => {
        if (err) { return reply(err.toString()).code(500) }
        results.rows.forEach(function (row) {
          ['minimum', 'quant25', 'average', 'quant75', 'maximum', 'stddev', 'samples'].forEach(function (fld) { row[fld] = parseFloat(row[fld]) })
        })
        reply(results.rows)
      })
    }
  })

  // Telemetry details
  server.route({
    method: 'GET',
    path: '/api/1/ci/telemetry/{ymd}',
    handler: (request, reply) => {
      var queryParams = {
        ymd: request.params.ymd
      }
      if (!!request.query.version) queryParams.version = request.query.version
      if (!!request.query.measure) queryParams.measure = request.query.measure
      if (!!request.query.machine) queryParams.machine = request.query.machine
      if (!!request.query.platformFilter) {
        queryParams.platform = { $in: request.query.platformFilter.split(',') }
      }
      if (!!request.query.channelFilter) {
        queryParams.channel = { $in: request.query.channelFilter.split(',') }
      }
      var query = mongo.collection('telemetry3').find(queryParams)
      query.toArray((err, rows) => {
        rows = rows.sort(function (a, b) {
          return a.ts - b.ts
        })
        reply(rows)
      })
    }
  })
}
