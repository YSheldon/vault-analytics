/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var _ = require('underscore')
var assert = require('assert')

var dataset = require('./dataset')
var retriever = require('../retriever')
var common = require('./common')

const DELTA = `
SELECT
  USG.ymd,
  USG.count,
  USG.prev,
  USG.delta,
  USG.delta / USG.count AS change,
  FST.first_count,
  USG.delta / FST.first_count AS retention
FROM
(SELECT
   TO_CHAR(ymd, 'YYYY-MM-DD') AS ymd,
   SUM(total) AS count,
   COALESCE(LAG(SUM(total), 1) OVER (ORDER BY ymd), SUM(total)) AS prev,
   SUM(total) - COALESCE(LAG(SUM(total), 1) OVER (ORDER BY ymd), SUM(total)) AS delta
 FROM dw.fc_usage
 WHERE
   ymd >= current_date - CAST($1 as INTERVAL) AND
   platform = ANY ($2) AND
   channel = ANY ($3)
 GROUP BY ymd ) USG JOIN
(SELECT
   TO_CHAR(FC.ymd, 'YYYY-MM-DD') AS ymd,
   SUM(FC.total) AS first_count
 FROM dw.fc_usage FC
 WHERE
   FC.ymd >= current_date - CAST($1 as INTERVAL) AND
   first_time AND
   FC.platform = ANY ($2) AND
   FC.channel = ANY ($3)
 GROUP BY FC.ymd ) FST ON USG.ymd = FST.ymd
ORDER BY USG.ymd DESC
`

const DAU = `
SELECT TO_CHAR(ymd, 'YYYY-MM-DD') AS ymd, SUM(total) AS count
FROM dw.fc_usage
WHERE
  ymd >= GREATEST(current_date - CAST($1 as INTERVAL), '2016-01-26'::date) AND
  platform = ANY ($2) AND
  channel = ANY ($3)
GROUP BY ymd
ORDER BY ymd DESC
`

const MAU_PLATFORM = `
SELECT
  LEFT(ymd::text, 7) || '-01' AS ymd,
  platform,
  sum(total) AS count
FROM dw.fc_usage_month
WHERE
  platform = ANY ($1) AND
  channel = ANY ($2) AND
  ymd > '2016-01-31'
GROUP BY
  left(ymd::text, 7),
  platform
ORDER BY
  left(ymd::text, 7),
 platform
`

const MAU = `
SELECT
  LEFT(ymd::text, 7) || '-01' AS ymd,
  sum(total) AS count
FROM dw.fc_usage_month
WHERE
  platform = ANY ($1) AND
  channel = ANY ($2) AND
  ymd > '2016-01-31'
GROUP BY
  left(ymd::text, 7)
ORDER BY
  left(ymd::text, 7)
`

const DAU_PLATFORM = `
SELECT
  TO_CHAR(FC.ymd, 'YYYY-MM-DD') AS ymd,
  FC.platform,
  SUM(FC.total) AS count,
ROUND(SUM(FC.total) / ( SELECT SUM(total) FROM dw.fc_usage WHERE ymd = FC.ymd AND platform = ANY ($2) AND channel = ANY ($3)), 3) * 100 AS daily_percentage
FROM dw.fc_usage FC
WHERE
  FC.ymd >= GREATEST(current_date - CAST($1 as INTERVAL), '2016-01-26'::date) AND
  FC.platform = ANY ($2) AND
  FC.channel = ANY ($3)
GROUP BY FC.ymd, FC.platform
ORDER BY FC.ymd DESC, FC.platform
`

const EYESHADE_WALLETS = `
SELECT
  TO_CHAR(FC.ymd, 'YYYY-MM-DD') AS ymd,
  FC.total AS count
FROM dw.fc_eyeshade_wallets FC
WHERE
  FC.ymd >= GREATEST(current_date - CAST($1 as INTERVAL), '2016-01-26'::date)
ORDER BY FC.ymd DESC
`

const DAU_PLATFORM_MINUS_FIRST = `
SELECT
  USAGE.ymd,
  USAGE.platform,
  USAGE.count AS all_count,
  FIR.first_count,
  USAGE.count - FIR.first_count AS count
FROM
(
SELECT
  TO_CHAR(FC.ymd, 'YYYY-MM-DD') AS ymd,
  FC.platform,
  SUM(FC.total) AS count
FROM dw.fc_usage FC
WHERE
  FC.ymd >= GREATEST(current_date - CAST($1 as INTERVAL), '2016-01-26'::date) AND
  FC.platform = ANY ($2) AND
  FC.channel = ANY ($3)
GROUP BY FC.ymd, FC.platform
  ORDER BY FC.ymd DESC, FC.platform
) USAGE JOIN (
SELECT
  TO_CHAR(FC.ymd, 'YYYY-MM-DD') AS ymd,
  FC.platform,
  SUM(FC.total) AS first_count
FROM dw.fc_usage FC
WHERE
  FC.ymd >= GREATEST(current_date - CAST($1 as INTERVAL), '2016-01-26'::date) AND
  FC.platform = ANY ($2) AND
  FC.channel = ANY ($3) AND
  FC.first_time
GROUP BY FC.ymd, FC.platform
  ORDER BY FC.ymd DESC, FC.platform
) FIR ON USAGE.ymd = FIR.ymd AND USAGE.platform = FIR.platform
ORDER BY USAGE.ymd DESC, USAGE.platform
`

const DAU_PLATFORM_FIRST = `
SELECT
  TO_CHAR(FC.ymd, 'YYYY-MM-DD') AS ymd,
  FC.platform,
  SUM(FC.total) AS count,
ROUND(SUM(FC.total) / ( SELECT SUM(total) FROM dw.fc_usage WHERE ymd = FC.ymd AND first_time AND platform = ANY ($2) AND channel = ANY ($3)), 3) * 100 AS daily_percentage
FROM dw.fc_usage FC
WHERE
  FC.ymd >= GREATEST(current_date - CAST($1 as INTERVAL), '2016-01-26'::date) AND
  first_time AND
  FC.platform = ANY ($2) AND
  FC.channel = ANY ($3)
GROUP BY FC.ymd, FC.platform
ORDER BY FC.ymd DESC, FC.platform
`

// We are using an number of different data sources in this query - hence the UNION
const DAU_PLATFORM_FIRST_SUMMARY = `
SELECT SM.platform, SM.count, PL.mobile, PL.vendor FROM (
SELECT
  sp.platform_mapping(FC.platform) AS platform,
  SUM(FC.total) AS count
FROM dw.fc_usage FC
WHERE
  FC.ymd >= GREATEST(current_date - CAST($1 as INTERVAL), '2016-01-26'::date) AND
  first_time AND
  ( sp.platform_mapping(FC.platform) <> 'ios' AND sp.platform_mapping(FC.platform) <> 'android' )
GROUP BY sp.platform_mapping(FC.platform)
  UNION
SELECT 'ios' AS platform, (SELECT SUM(downloads) FROM appannie.fc_inception_by_country) AS count
  UNION
SELECT 'android' AS platform, (SELECT SUM(downloads) FROM appannie.fc_android_inception_by_country) AS count
) SM JOIN dw.dm_platform PL ON SM.platform = PL.platform
ORDER BY PL.mobile, PL.vendor
`

const PLATFORM_SUMMARY_GEO = `
SELECT 'ios' AS platform, FC.country_code, DM.name, '000' AS dma, FC.downloads
FROM appannie.fc_inception_by_country FC JOIN appannie.dm_countries DM ON FC.country_code = DM.code
`

const DAU_VERSION = `
SELECT
  TO_CHAR(FC.ymd, 'YYYY-MM-DD') AS ymd,
  FC.version,
  SUM(FC.total) AS count,
  ROUND(SUM(FC.total) / ( SELECT SUM(total) FROM dw.fc_usage WHERE ymd = FC.ymd AND platform = ANY ($2) AND channel = ANY ($3) ), 3) * 100 AS daily_percentage
FROM dw.fc_usage FC
WHERE
  FC.ymd >= GREATEST(current_date - CAST($1 as INTERVAL), '2016-01-26'::date) AND
  FC.platform = ANY ($2) AND
  FC.channel = ANY ($3)
GROUP BY FC.ymd, FC.version
ORDER BY FC.ymd DESC, FC.version
`


// Data endpoints
exports.setup = (server, client, mongo) => {
  assert(mongo, 'mongo configured')

  // Version for today's daily active users
  server.route({
    method: 'GET',
    path: '/api/1/versions',
    handler: function (request, reply) {
      let days = parseInt(request.query.days || 7, 10) + ' days'
      let platforms = common.platformPostgresArray(request.query.platformFilter)
      let channels = common.channelPostgresArray(request.query.channelFilter)
      client.query(DAU_VERSION, [days, platforms, channels], (err, results) => {
        if (err) {
          reply(err.toString).code(500)
        } else {
          results.rows.forEach((row) => common.formatPGRow(row))
          // condense small version counts to an 'other' category
          results.rows = dataset.condense(results.rows, 'ymd', 'version')
          results.rows = common.potentiallyFilterToday(results.rows, request.query.showToday === 'true')
          reply(results.rows)
        }
      })
    }
  })

  // Daily active users
  server.route({
    method: 'GET',
    path: '/api/1/dau',
    handler: function (request, reply) {
      let days = parseInt(request.query.days || 7, 10)
      days += ' days'
      let platforms = common.platformPostgresArray(request.query.platformFilter)
      let channels = common.channelPostgresArray(request.query.channelFilter)
      client.query(DAU, [days, platforms, channels], (err, results) => {
        if (err) {
          reply(err.toString()).status(500)
        } else {
          results.rows.forEach((row) => common.formatPGRow(row))
          results.rows = common.potentiallyFilterToday(results.rows, request.query.showToday === 'true')
          reply(results.rows)
        }
      })
    }
  })

  // Daily active users by platform
  server.route({
    method: 'GET',
    path: '/api/1/dau_platform',
    handler: function (request, reply) {
      let days = parseInt(request.query.days || 7, 10)
      days += ' days'
      let platforms = common.platformPostgresArray(request.query.platformFilter)
      let channels = common.channelPostgresArray(request.query.channelFilter)
      client.query(DAU_PLATFORM, [days, platforms, channels], (err, results) => {
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

  // Daily active users by platform
  server.route({
    method: 'GET',
    path: '/api/1/dau_platform_minus_first',
    handler: function (request, reply) {
      let days = parseInt(request.query.days || 7, 10)
      days += ' days'
      let platforms = common.platformPostgresArray(request.query.platformFilter)
      let channels = common.channelPostgresArray(request.query.channelFilter)
      client.query(DAU_PLATFORM_MINUS_FIRST, [days, platforms, channels], (err, results) => {
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

  // Monthly active users by platform
  server.route({
    method: 'GET',
    path: '/api/1/mau_platform',
    handler: function (request, reply) {
      let platforms = common.platformPostgresArray(request.query.platformFilter)
      let channels = common.channelPostgresArray(request.query.channelFilter)
      client.query(MAU_PLATFORM, [platforms, channels], (err, results) => {
        if (err) {
          console.log(err.toString())
          reply(err.toString()).code(500)
        } else {
          results.rows.forEach((row) => common.formatPGRow(row))
          results.rows = common.potentiallyFilterThisMonth(results.rows, request.query.showToday === 'true')
          reply(results.rows)
        }
      })
    }
  })

  // Monthly active users
  server.route({
    method: 'GET',
    path: '/api/1/mau',
    handler: function (request, reply) {
      let platforms = common.platformPostgresArray(request.query.platformFilter)
      let channels = common.channelPostgresArray(request.query.channelFilter)
      client.query(MAU, [platforms, channels], (err, results) => {
        if (err) {
          console.log(err.toString())
          reply(err.toString()).code(500)
        } else {
          results.rows.forEach((row) => common.formatPGRow(row))
          results.rows = common.potentiallyFilterThisMonth(results.rows, request.query.showToday === 'true')
          reply(results.rows)
        }
      })
    }
  })

  // Daily new users by platform
  server.route({
    method: 'GET',
    path: '/api/1/dau_platform_first',
    handler: function (request, reply) {
      let days = parseInt(request.query.days || 7, 10) + ' days'
      let platforms = common.platformPostgresArray(request.query.platformFilter)
      let channels = common.channelPostgresArray(request.query.channelFilter)
      client.query(DAU_PLATFORM_FIRST, [days, platforms, channels], (err, results) => {
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

  // New users by platform summary
  server.route({
    method: 'GET',
    path: '/api/1/dau_platform_first_summary',
    handler: function (request, reply) {
      // default to all time
      let days = parseInt(request.query.days || 10000, 10) + ' days'
      client.query(DAU_PLATFORM_FIRST_SUMMARY, [days], (err, results) => {
        if (err) {
          reply(err.toString()).code(500)
        } else {
          results.rows.forEach((row) => common.formatPGRow(row))
          reply(results.rows)
        }
      })
    }
  })

  // New users by platform summary geo and dma
  server.route({
    method: 'GET',
    path: '/api/1/dau_platform_first_summary_geo',
    handler: function (request, reply) {
      // default to all time
      let days = parseInt(request.query.days || 10000, 10) + ' days'
      client.query(PLATFORM_SUMMARY_GEO, [], (err, results) => {
        if (err) {
          reply(err.toString()).code(500)
        } else {
          results.rows.forEach((row) => { row.downloads = parseInt(row.downloads, 10) })
          var grouped = _.groupBy(results.rows, (row) => { return row.platform })
          _.each(grouped, (records, platform) => {
            var sum = _.reduce(records, (memo, record) => { return memo + record.downloads }, 0)
            _.each(records, (record) => { record.percentage = common.round(record.downloads / sum * 100, 1) })
          })
          reply(grouped)
        }
      })
    }
  })

  // Eyeshade / ledger wallets by day
  server.route({
    method: 'GET',
    path: '/api/1/eyeshade_wallets',
    handler: function (request, reply) {
      let days = parseInt(request.query.days || 7, 10)
      days += ' days'
      client.query(EYESHADE_WALLETS, [days], (err, results) => {
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

  // Daily user retention stats
  server.route({
    method: 'GET',
    path: '/api/1/dus',
    handler: function (request, reply) {
      let days = parseInt(request.query.days || 7, 10) + ' days'
      let platforms = common.platformPostgresArray(request.query.platformFilter)
      let channels = common.channelPostgresArray(request.query.channelFilter)
      client.query(DELTA, [days, platforms, channels], (err, results) => {
        if (err) {
          reply(err.toString()).code(500)
        } else {
          const columns = ['count', 'prev', 'delta', 'change', 'first_count', 'retention']
          results.rows.forEach((row) => {
            _.each(columns, (column) => {
              row[column] = parseFloat(row[column])
            })
          })
          results.rows = common.potentiallyFilterToday(results.rows, request.query.showToday === 'true')
          reply(results.rows)
        }
      })
    }
  })
}
