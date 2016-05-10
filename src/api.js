var _ = require('underscore')
var assert = require('assert')

var dataset = require('./dataset')
var retriever = require('./retriever')

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

const formatPGRow = (row) => {
  if (row.count) {
    row.count = parseInt(row.count, 10)
    if (row.first_count) {
      row.first_count = parseInt(row.first_count, 10)
    }
    if (row.all_count) {
      row.all_count = parseInt(row.all_count, 10)
    }
  }
  if (row.daily_percentage) {
    row.daily_percentage = parseFloat(row.daily_percentage)
  }
  return row
}

const todayISODate = () => {
  let d = new Date()
  return [d.getFullYear(), ('0' + (d.getMonth() + 1)).slice(-2), ('0' + d.getDate()).slice(-2)].join('-')
}

const todayISOMonth = () => {
  let d = new Date()
  return [d.getFullYear(), ('0' + (d.getMonth() + 1)).slice(-2), '01'].join('-')
}

const potentiallyFilterToday = (rows, showToday) => {
  if (!showToday) {
    var today = todayISODate()
    rows = _.filter(rows, (row) => {
      return row.ymd < today
    })
  }
  return rows
}

const potentiallyFilterThisMonth = (rows, showMonth) => {
  if (!showMonth) {
    var thisMonth = todayISOMonth()
    rows = _.filter(rows, (row) => {
      return row.ymd < thisMonth
    })
  }
  return rows
}

let allPlatforms = ['osx', 'winx64', 'winia32', 'ios', 'android', 'unknown', 'linux']
let allChannels = ['dev', 'beta', 'stable']

let platformPostgresArray = (platformFilter) => {
  let platforms = _.filter((platformFilter || '').split(','), (platform) => platform !== '')
  if (!platforms.length) {
    return allPlatforms
  } else {
    return platforms
  }
}

let channelPostgresArray = (channelFilter) => {
  let channels = _.filter((channelFilter || '').split(','), (channel) => channel !== '')
  if (!channels.length) {
    return allChannels
  } else {
    return channels
  }
}

// Data endpoints
exports.setup = (server, client, mongo) => {
  assert(mongo, 'mongo configured')

  // Version for today's daily active users
  server.route({
    method: 'GET',
    path: '/api/1/versions',
    handler: function (request, reply) {
      let days = parseInt(request.query.days || 7, 10) + ' days'
      let platforms = platformPostgresArray(request.query.platformFilter)
      let channels = channelPostgresArray(request.query.channelFilter)
      client.query(DAU_VERSION, [days, platforms, channels], (err, results) => {
        if (err) {
          reply(err.toString).code(500)
        } else {
          results.rows.forEach((row) => formatPGRow(row))
          // condense small version counts to an 'other' category
          results.rows = dataset.condense(results.rows, 'ymd', 'version')
          results.rows = potentiallyFilterToday(results.rows, request.query.showToday === 'true')
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
      let platforms = platformPostgresArray(request.query.platformFilter)
      let channels = channelPostgresArray(request.query.channelFilter)
      client.query(DAU, [days, platforms, channels], (err, results) => {
        if (err) {
          reply(err.toString()).status(500)
        } else {
          results.rows.forEach((row) => formatPGRow(row))
          results.rows = potentiallyFilterToday(results.rows, request.query.showToday === 'true')
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
      let platforms = platformPostgresArray(request.query.platformFilter)
      let channels = channelPostgresArray(request.query.channelFilter)
      client.query(DAU_PLATFORM, [days, platforms, channels], (err, results) => {
        if (err) {
          reply(err.toString()).code(500)
        } else {
          results.rows.forEach((row) => formatPGRow(row))
          results.rows = potentiallyFilterToday(results.rows, request.query.showToday === 'true')
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
      let platforms = platformPostgresArray(request.query.platformFilter)
      let channels = channelPostgresArray(request.query.channelFilter)
      client.query(DAU_PLATFORM_MINUS_FIRST, [days, platforms, channels], (err, results) => {
        if (err) {
          reply(err.toString()).code(500)
        } else {
          results.rows.forEach((row) => formatPGRow(row))
          results.rows = potentiallyFilterToday(results.rows, request.query.showToday === 'true')
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
      let platforms = platformPostgresArray(request.query.platformFilter)
      let channels = channelPostgresArray(request.query.channelFilter)
      client.query(MAU_PLATFORM, [platforms, channels], (err, results) => {
        if (err) {
          console.log(err.toString())
          reply(err.toString()).code(500)
        } else {
          results.rows.forEach((row) => formatPGRow(row))
          results.rows = potentiallyFilterThisMonth(results.rows, request.query.showToday === 'true')
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
      let platforms = platformPostgresArray(request.query.platformFilter)
      let channels = channelPostgresArray(request.query.channelFilter)
      client.query(MAU, [platforms, channels], (err, results) => {
        if (err) {
          console.log(err.toString())
          reply(err.toString()).code(500)
        } else {
          results.rows.forEach((row) => formatPGRow(row))
          results.rows = potentiallyFilterThisMonth(results.rows, request.query.showToday === 'true')
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
      let platforms = platformPostgresArray(request.query.platformFilter)
      let channels = channelPostgresArray(request.query.channelFilter)
      client.query(DAU_PLATFORM_FIRST, [days, platforms, channels], (err, results) => {
        if (err) {
          reply(err.toString()).code(500)
        } else {
          results.rows.forEach((row) => formatPGRow(row))
          results.rows = potentiallyFilterToday(results.rows, request.query.showToday === 'true')
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
      let platforms = platformPostgresArray(request.query.platformFilter)
      let channels = channelPostgresArray(request.query.channelFilter)
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
          results.rows = potentiallyFilterToday(results.rows, request.query.showToday === 'true')
          reply(results.rows)
        }
      })
    }
  })

  // Crash reports
  server.route({
    method: 'GET',
    path: '/api/1/dc_platform',
    handler: function (request, reply) {
      let days = parseInt(request.query.days || 7, 10)
      days += ' days'
      let platforms = platformPostgresArray(request.query.platformFilter)
      let channels = channelPostgresArray(request.query.channelFilter)
      client.query(CRASHES_PLATFORM, [days, platforms, channels], (err, results) => {
        if (err) {
          reply(err.toString()).code(500)
        } else {
          results.rows.forEach((row) => formatPGRow(row))
          results.rows = potentiallyFilterToday(results.rows, request.query.showToday === 'true')
          reply(results.rows)
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
      let platforms = platformPostgresArray(request.query.platformFilter)
      let channels = channelPostgresArray(request.query.channelFilter)
      client.query(CRASHES_PLATFORM_VERSION, [days, platforms, channels], (err, results) => {
        if (err) {
          reply(err.toString()).code(500)
        } else {
          results.rows.forEach((row) => formatPGRow(row))
          results.rows = potentiallyFilterToday(results.rows, request.query.showToday === 'true')
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
}
