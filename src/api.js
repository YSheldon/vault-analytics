var _ = require('underscore')

const DAU = `
SELECT TO_CHAR(ymd, 'YYYY-MM-DD') AS ymd, SUM(total) AS count
FROM dw.fc_usage
WHERE
  ymd >= current_date - CAST($1 as INTERVAL) AND
  platform = ANY ($2)
GROUP BY ymd
ORDER BY ymd DESC
`

const DAU_PLATFORM = `
SELECT TO_CHAR(ymd, 'YYYY-MM-DD') AS ymd, platform, SUM(total) AS count
FROM dw.fc_usage
WHERE
  ymd >= current_date - CAST($1 as INTERVAL) AND
  platform = ANY ($2)
GROUP BY ymd, platform
ORDER BY ymd DESC, platform
`

const DAU_VERSION = `
SELECT TO_CHAR(ymd, 'YYYY-MM-DD') AS ymd, version, SUM(total) AS count
FROM dw.fc_usage
WHERE
  ymd >= current_date - CAST($1 as INTERVAL) AND
  platform = ANY ($2)
GROUP BY ymd, version
ORDER BY ymd DESC, version
`

const formatPGRow = (row) => {
  if (row.count) {
    row.count = parseInt(row.count, 10)
  }
  return row
}

/*
 * Pull k/v pairs out of a contained child object
 *
 * { a: { b: 1, c: 2 }, d: 3 } -> { b: 1, c: 2, d: 3}
 */
const pullOutAttribs = (obj, k) => {
  Object.keys(obj[k]).forEach((internalKey) => {
    obj[internalKey] = obj[k][internalKey]
  })
  delete obj[k]
  return obj
}

let allPlatforms = ['osx', 'winx64', 'ios', 'android']

let platformPostgresArray = (platformFilter) => {
  let platforms = _.filter((platformFilter || '').split(','), (platform) => platform !== '')
  if (!platforms.length) {
    return allPlatforms
  } else {
    return platforms
  }
}

// Data endpoints
exports.setup = (server, client) => {
  // Version for today's daily active users
  server.route({
    method: 'GET',
    path: '/api/1/versions',
    handler: function (request, reply) {
      let days = parseInt(request.query.days || 7, 10)
      days += ' days'
      let platforms = platformPostgresArray(request.query.platformFilter)
      client.query(DAU_VERSION, [days, platforms], (err, results) => {
        if (err) {
          reply(err.toString).statusCode(500)
        } else {
          results.rows.forEach((row) => formatPGRow(row))
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
      client.query(DAU, [days, platforms], (err, results) => {
        if (err) {
          reply(err.toString()).status(500)
        } else {
          results.rows.forEach((row) => formatPGRow(row))
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
      client.query(DAU_PLATFORM, [days, platforms], (err, results) => {
        if (err) {
          reply(err.toString()).statusCode(500)
        } else {
          results.rows.forEach((row) => formatPGRow(row))
          reply(results.rows)
        }
      })
    }
  })

  // Crash reports
  server.route({
    method: 'GET',
    path: '/api/1/dc',
    handler: function (request, reply) {
      let days = parseInt(request.query.days || 7, 10)
      days += ' days'
      let platforms = platformPostgresArray(request.query.platformFilter)
      reporting.dailyCrashesGrouped(db, (err, rows) => {
        if (err) {
          reply(err.toString).statusCode(500)
        } else {
          rows.forEach((row) => pullOutAttribs(row, '_id'))
          reply(rows)
        }
      })
    }
  })

}
