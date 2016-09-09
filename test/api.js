var tap = require('tap')
var _ = require('underscore')

var apiCommon = require('../dist/api/common')

tap.ok(_.isArray(apiCommon.allPlatforms) && apiCommon.allPlatforms.length > 0, 'allPlatforms is defined correctly')

tap.ok(_.isArray(apiCommon.allChannels) && apiCommon.allChannels.length > 0, 'allChannels is defined correctly')

tap.ok(apiCommon.channelPostgresArray('').length === apiCommon.allChannels.length, 'channel filter works with empty filter')

tap.ok(apiCommon.channelPostgresArray('dev,stable').length === 2, 'channel filter works with filter')

tap.ok(apiCommon.platformPostgresArray('').length === apiCommon.allPlatforms.length, 'platform filter works with empty filter')

tap.ok(apiCommon.platformPostgresArray('osx,ios').length === 2, 'platform filter works with filter')

// buildQueryReponseHandler test

// Postgres client connection mock
var mockClient = {
  query: function (sql, params, cb) {
    tap.equal(params.length, 1, 'one parameter provider')
    tap.equal(params[0], 1000, 'correct parameter')
    tap.equal(sql, 'SELECT', 'correct sql passed')
    cb(null, {
      rows: [
        { a: 1, b: 2 },
        { a: 3, b: 4 }
      ]
    })
  }
}

// HTTP request mock
var mockRequest = {
  params: {
    age: 1000
  }
}

// HTTP reply mock
var mockReply = function (contents) {
  tap.equal(contents.length, 2, '2 rows passed')
  tap.equal(contents[0].a, 2, 'transferred results correct a')
  tap.equal(contents[1].b, 2, 'transferred results correct b')
}

var requestHandler = apiCommon.buildQueryReponseHandler(
  mockClient,
  'SELECT',
  function (reply, results, request) {
    results.rows = results.rows.map(function (row) {
      return {
        a: row.a * 2,
        b: row.b / 2
      }
    })
    reply(results.rows)
  },
  function (request) {
    return [request.params.age]
  }
)

requestHandler(mockRequest, mockReply)
