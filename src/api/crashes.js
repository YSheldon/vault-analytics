/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var _ = require('underscore')

var retriever = require('../retriever')
var crash = require('../crash')
var mini = require('../mini')
var common = require('./common')

const CRASHES_PLATFORM_VERSION = `
SELECT
  TO_CHAR(FC.ymd, 'YYYY-MM-DD') AS ymd,
  FC.platform || ' ' || FC.version as platform,
  SUM(FC.total) AS count,
  ROUND(SUM(FC.total) / ( SELECT SUM(total) FROM dw.fc_crashes WHERE ymd = FC.ymd AND platform = ANY ($2) AND channel = ANY ($3) ), 3) * 100 AS daily_percentage
FROM dw.fc_crashes FC
WHERE
  FC.ymd >= current_date - CAST($1 as INTERVAL) AND
  FC.platform = ANY ($2) AND
  FC.channel = ANY ($3)
GROUP BY FC.ymd, FC.platform || ' ' || FC.version
ORDER BY FC.ymd DESC, FC.platform || ' ' || FC.version
`

const CRASH_REPORTS = `
SELECT
  contents->>'_version'                 AS version,
  contents->>'platform'                 AS platform,
  contents->'metadata'->>'crash_reason' AS crash_reason,
  contents->'metadata'->>'cpu'          AS cpu,
  COUNT(*)                              AS total
FROM dtl.crashes
WHERE
  TO_DATE(contents->>'year_month_day', 'YYYY-MM-DD') >= current_date - CAST($1 as INTERVAL)
GROUP BY
  contents->>'_version',
  contents->>'platform',
  contents->'metadata'->>'crash_reason',
  contents->'metadata'->>'cpu'
ORDER BY
  COUNT(*) DESC
`

const RECENT_CRASH_REPORT_DETAILS = `
SELECT
  id,
  contents->>'year_month_day'                                AS ymd,
  contents->>'_version'                                      AS version,
  contents->>'platform'                                      AS platform,
  COALESCE(contents->'metadata'->>'cpu', 'Unknown')          AS cpu,
  COALESCE(contents->'metadata'->>'crash_reason', 'Unknown') AS crash_reason
FROM dtl.crashes
WHERE
  TO_DATE(contents->>'year_month_day', 'YYYY-MM-DD') >= current_date - CAST($1 as INTERVAL)
ORDER BY ts DESC
`

const CRASH_REPORT_DETAILS = `
SELECT
  id,
  contents->>'year_month_day'                                AS ymd,
  contents->>'_version'                                      AS version,
  contents->>'platform'                                      AS platform,
  COALESCE(contents->'metadata'->>'cpu', 'Unknown')          AS cpu,
  COALESCE(contents->'metadata'->>'crash_reason', 'Unknown') AS crash_reason
FROM dtl.crashes
WHERE
  contents->>'platform' = $1 AND
  contents->>'_version' = $2 AND
  TO_DATE(contents->>'year_month_day', 'YYYY-MM-DD') >= current_date - CAST($3 as INTERVAL) AND
  contents->'metadata'->>'crash_reason' = $4 AND
  contents->'metadata'->>'cpu' = $5
ORDER BY ts DESC
`

const CRASHES_PLATFORM = `
SELECT
  TO_CHAR(FC.ymd, 'YYYY-MM-DD') AS ymd,
  FC.platform,
  SUM(FC.total) AS count,
  ROUND(SUM(FC.total) / ( SELECT SUM(total) FROM dw.fc_crashes WHERE ymd = FC.ymd AND platform = ANY ($2) AND channel = ANY ($3) ), 3) * 100 AS daily_percentage
FROM dw.fc_crashes FC
WHERE
  FC.ymd >= current_date - CAST($1 as INTERVAL) AND
  FC.platform = ANY ($2) AND
  FC.channel = ANY ($3)
GROUP BY FC.ymd, FC.platform
ORDER BY FC.ymd DESC, FC.platform
`

exports.setup = (server, client, mongo) => {

    // Crash reports
  server.route({
    method: 'GET',
    path: '/api/1/dc_platform',
    handler: function (request, reply) {
      let days = parseInt(request.query.days || 7, 10)
      days += ' days'
      let platforms = common.platformPostgresArray(request.query.platformFilter)
      let channels = common.channelPostgresArray(request.query.channelFilter)
      client.query(CRASHES_PLATFORM, [days, platforms, channels], (err, results) => {
        if (err) {
          reply(err.toString()).code(500)
        } else {
          results.rows.forEach((row) => common.formatPGRow(row))
          results.rows = common.potentiallyFilterToday(results.rows, request.query.showToday === 'true')
          reply(results.rows)
        }
      })
    }
  })

    // Crashes for a day / platform
  server.route({
    method: 'GET',
    path: '/api/1/dc_platform_detail',
    handler: function (request, reply) {
      retriever.crashesForYMDPlatform(mongo, request.query.ymd, request.query.platform, (err, results) => {
        if (err) {
          reply(err.toString()).code(500)
        } else {
          reply(results)
        }
      })
    }
  })

  // Download a crash report
  server.route({
    method: 'GET',
    path: '/download/crash_report/{id}',
    handler: function (request, reply) {
      mini.readAndStore(request.params.id, (filename) => {
        console.log("Downloading " + request.params.id + ', ' + filename)
        reply.file(filename)
      })
    }
  })

  server.route({
    method: 'GET',
    path: '/api/1/crash_reports',
    handler: function (request, reply) {
      let days = parseInt(request.query.days || 7, 10)
      days += ' days'
      let platforms = common.platformPostgresArray(request.query.platformFilter)
      let channels = common.channelPostgresArray(request.query.channelFilter)
      client.query(CRASH_REPORTS, [days], (err, results) => {
        if (err) {
          console.log(err)
          reply(err.toString()).code(500)
        } else {
          reply(results.rows)
        }
      })
    }
  })

  server.route({
    method: 'GET',
    path: '/api/1/crash_report_details',
    handler: function (request, reply) {
      let days = parseInt(request.query.days || 7, 10)
      days += ' days'
      console.log(request.query)
      client.query(CRASH_REPORT_DETAILS, [request.query.platform, request.query.version, days, request.query.crash_reason, request.query.cpu], (err, results) => {
        if (err) {
          reply(err.toString()).code(500)
        } else {
          results.rows.forEach((row) => common.formatPGRow(row))
          reply(results.rows)
        }
      })
    }
  })

  server.route({
    method: 'GET',
    path: '/api/1/recent_crash_report_details',
    handler: function (request, reply) {
      let days = parseInt(request.query.days || 7, 10)
      days += ' days'
      console.log(request.query)
      client.query(RECENT_CRASH_REPORT_DETAILS, [days], (err, results) => {
        if (err) {
          reply(err.toString()).code(500)
        } else {
          results.rows.forEach((row) => common.formatPGRow(row))
          reply(results.rows)
        }
      })
    }
  })

  server.route({
    method: 'GET',
    path: '/api/1/crash_report',
    handler: function (request, reply) {
      var id = request.query.id
      crash.parsedCrash(client, id, (err, results) => {
        if (err) {
          reply(err.toString()).code(500)
        } else {
          reply(results)
        }
      })
    }
  })

  // Crash reports by platform / version
  server.route({
    method: 'GET',
    path: '/api/1/dc_platform_version',
    handler: function (request, reply) {
      let days = parseInt(request.query.days || 7, 10)
      days += ' days'
      let platforms = common.platformPostgresArray(request.query.platformFilter)
      let channels = common.channelPostgresArray(request.query.channelFilter)
      client.query(CRASHES_PLATFORM_VERSION, [days, platforms, channels], (err, results) => {
        if (err) {
          reply(err.toString()).code(500)
        } else {
          results.rows.forEach((row) => common.formatPGRow(row))
          results.rows = common.potentiallyFilterToday(results.rows, request.query.showToday === 'true')
          reply(results.rows)
        }
      })
    }
  })

}
