/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var _ = require('underscore')
var Joi = require('joi')

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

const CRASH_REPORTS_SIGNATURE = `
SELECT
  version,
  platform,
  cpu,
  crash_reason,
  signature,
  sp.canonical_platform(platform, cpu) as canonical_platform,
  SUM(total) AS total
FROM dw.fc_crashes_mv
WHERE
  ymd >= current_date - cast($1 AS interval) AND
  sp.canonical_platform(platform, cpu) = ANY ($2)
GROUP BY
  version,
  platform,
  cpu,
  crash_reason,
  signature,
  sp.canonical_platform(platform, cpu)
HAVING SUM(total) > 10
ORDER BY total DESC
`

const CRASH_RATIO = `
SELECT version, platform, crashes, total, crashes / total AS crash_rate
FROM
( SELECT
  version,
  platform,
  SUM(crashes) as crashes,
  SUM(total) as total
FROM dw.fc_crashes_dau_mv
WHERE
  ymd >= current_date - cast($1 AS interval) AND
  platform = ANY ($2) AND
  version = COALESCE($3, version)
GROUP BY
  version,
  platform
HAVING SUM(total) > 50 ) CR
ORDER BY crashes / total DESC
`

const CRASH_REPORT_DETAILS_PLATFORM_VERSION = `
SELECT
  id,
  ts,
  contents->>'year_month_day'                                         AS ymd,
  COALESCE(contents->>'ver', '0.0.0')                                 AS electron_version,
  contents->>'_version'                                               AS version,
  contents->>'platform'                                               AS platform,
  COALESCE(contents->'metadata'->>'cpu', 'Unknown')                   AS cpu,
  COALESCE(contents->'metadata'->>'crash_reason', 'Unknown')          AS crash_reason,
  COALESCE(contents->'metadata'->>'signature', 'unknown')             AS signature,
  COALESCE(contents->'metadata'->>'operating_system_name', 'Unknown') AS operating_system_name
FROM dtl.crashes
WHERE
  contents->>'platform' = $1 AND
  contents->>'_version' = $2 AND
  sp.to_ymd((contents->>'year_month_day'::text)) >= current_date - CAST($3 as INTERVAL)
ORDER BY ts DESC
`

const RECENT_CRASH_REPORT_DETAILS = `
SELECT
  id,
  ts,
  contents->>'year_month_day'                                                AS ymd,
  COALESCE(contents->>'ver', '0.0.0')                                        AS electron_version,
  contents->>'_version'                                                      AS version,
  contents->>'platform'                                                      AS platform,
  COALESCE(contents->'metadata'->>'cpu', 'Unknown')                          AS cpu,
  COALESCE(contents->'metadata'->>'crash_reason', 'Unknown')                 AS crash_reason,
  COALESCE(contents->'metadata'->>'signature', 'Unknown')                    AS signature,
  COALESCE(contents->'metadata'->>'operating_system_name', 'Unknown')        AS operating_system_name,
  sp.canonical_platform(contents->>'platform', contents->'metadata'->>'cpu') AS canonical_platform
FROM dtl.crashes
WHERE
  sp.to_ymd((contents->>'year_month_day'::text)) >= current_date - CAST($1 as INTERVAL) AND
  sp.canonical_platform(contents->>'platform', contents->'metadata'->>'cpu') = ANY ($2)
ORDER BY ts DESC
LIMIT 100
`

const CRASH_REPORT_DETAILS = `
SELECT
  id,
  ts,
  contents->>'year_month_day'                                         AS ymd,
  COALESCE(contents->>'ver', '0.0.0')                                 AS electron_version,
  contents->>'_version'                                               AS version,
  contents->>'platform'                                               AS platform,
  COALESCE(contents->'metadata'->>'cpu', 'Unknown')                   AS cpu,
  COALESCE(contents->'metadata'->>'crash_reason', 'Unknown')          AS crash_reason,
  COALESCE(contents->'metadata'->>'signature', 'unknown')             AS signature,
  COALESCE(contents->'metadata'->>'operating_system_name', 'Unknown') AS operating_system_name
FROM dtl.crashes
WHERE
  contents->>'platform' = $1 AND
  contents->>'_version' = $2 AND
  sp.to_ymd((contents->>'year_month_day'::text)) >= current_date - CAST($3 as INTERVAL) AND
  contents->'metadata'->>'crash_reason' = $4 AND
  contents->'metadata'->>'cpu' = $5 AND
  COALESCE(contents->'metadata'->>'signature', 'unknown') = $6
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

const CRASH_VERSIONS = `
SELECT
  contents->>'_version' AS version,
  count(1) as total
FROM dtl.crashes
WHERE
  contents->>'_version' IS NOT NULL AND
  sp.to_ymd((contents->>'year_month_day'::text)) >= current_date - CAST($1 as INTERVAL)
GROUP BY contents->>'_version'
ORDER BY sp.comparable_version(contents->>'_version') DESC
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
      client.query(CRASH_REPORTS_SIGNATURE, [days, platforms], (err, results) => {
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
    path: '/api/1/crash_ratios',
    handler: function (request, reply) {
      let days = parseInt(request.query.days || 7, 10)
      days += ' days'
      let platforms = common.platformPostgresArray(request.query.platformFilter)
      let channels = common.channelPostgresArray(request.query.channelFilter)
      let version = request.query.version || null
      client.query(CRASH_RATIO, [days, platforms, version], (err, results) => {
        if (err) {
          console.log(err)
          reply(err.toString()).code(500)
        } else {
          results.rows.forEach((row) => {
            row.crashes = parseInt(row.crashes)
            row.total = parseInt(row.total)
            row.crash_rate = parseFloat(row.crash_rate)
          })
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
      client.query(CRASH_REPORT_DETAILS, [request.query.platform, request.query.version, days, request.query.crash_reason, request.query.cpu, request.query.signature], (err, results) => {
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
    path: '/api/1/crash_report_platform_version_details',
    handler: function (request, reply) {
      let days = parseInt(request.query.days || 7, 10)
      days += ' days'
      client.query(CRASH_REPORT_DETAILS_PLATFORM_VERSION, [request.query.platform, request.query.version, days], (err, results) => {
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
      let platforms = common.platformPostgresArray(request.query.platformFilter)
      client.query(RECENT_CRASH_REPORT_DETAILS, [days, platforms], (err, results) => {
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
      crash.storedCrash(client, id, (err, results) => {
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

  server.route({
    method: 'GET',
    path: '/api/1/crash_versions',
    handler: function (request, reply) {
      let days = parseInt(request.query.days || 14, 10)
      days += ' days'
      client.query(CRASH_VERSIONS, [days], (err, results) => {
        if (err) {
          reply(err.toString()).code(500)
        } else {
          results.rows.forEach((row) => common.formatPGRow(row))
          reply(results.rows)
        }
      })
    }
  })

  // We call reindexCrash outside of a trigger because the change to the crash_tags table
  // in not visible until the SQL statement is complete. Issuing a NOP update allows
  // the tags to be visibile to the indexing function.
  function reindexCrash (client, id, done) {
    client.query('UPDATE dtl.crashes SET id = id WHERE id = $1', [id], done)
  }

  const POST_TAG = `
  INSERT INTO dtl.crash_tags (crash_id, tag) VALUES ($1, $2) ON CONFLICT (crash_id, tag) DO NOTHING
  `

  server.route({
    method: 'POST',
    path: '/api/1/crashes/{id}/tags/{tag}',
    config: {
      validate: {
        params: {
          id: Joi.string().alphanum().required(),
          tag: Joi.string().required(),
        }
      }
    },
    handler: function (request, reply) {
      client.query(POST_TAG, [request.params.id, request.params.tag], (err, results) => {
        if (err) {
          console.log(err)
          reply(err.toString()).code(500)
        } else {
          reindexCrash(client, request.params.id, (err, results) => {
            reply('OK').code(200)
          })
        }
      })
    }
  })

  const DELETE_TAG = `
  DELETE FROM dtl.crash_tags WHERE crash_id = $1 AND tag = $2
  `

  server.route({
    method: 'DELETE',
    path: '/api/1/crashes/{id}/tags/{tag}',
    config: {
      validate: {
        params: {
          id: Joi.string().alphanum().required(),
          tag: Joi.string().required(),
        }
      }
    },
    handler: function (request, reply) {
      client.query(DELETE_TAG, [request.params.id, request.params.tag], (err, results) => {
        console.log(results)
        if (err) {
          reply(err.toString()).code(500)
        } else {
          reindexCrash(client, request.params.id, (err, results) => {
            reply('OK').code(200)
          })
        }
      })
    }
  })

  const CRASH_TAGS = `SELECT crash_id, tag FROM dtl.crash_tags WHERE crash_id = $1`

  server.route({
    method: 'GET',
    path: '/api/1/crashes/{id}/tags',
    handler: function (request, reply) {
      client.query(CRASH_TAGS, [request.params.id], (err, results) => {
        if (err) {
          reply(err.toString()).code(500)
        } else {
          reply(results.rows)
        }
      })
    }
  })

  const AVAILABLE_CRASH_TAGS = `SELECT tag, description FROM dtl.crash_tags_available ORDER BY tag`

  server.route({
    method: 'GET',
    path: '/api/1/available_crash_tags',
    handler: function (request, reply) {
      client.query(AVAILABLE_CRASH_TAGS, [], (err, results) => {
        if (err) {
          reply(err.toString()).code(500)
        } else {
          reply(results.rows)
        }
      })
    }
  })

}
