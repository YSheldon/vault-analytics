var tap = require('tap')
var _ = require('underscore')

var model = require('../dist/model')

// Test usageUpserter model function
tap.test('usageUpserter', function (clientTest) {
  // Mock the Postgres client interface
  var client = {
    query: function (sql, parameters, cb) {
      tap.ok(sql.match(/fc_usage/g), 'insert into correct table')
      tap.ok(parameters[0] === '2016-01-01', 'correct parameter')
      tap.ok(parameters[1] === 'osx', 'correct platform')
      tap.ok(parameters[2] === '0.10.0', 'correct version')
      tap.ok(parameters[3] === false, 'correct first time')
      tap.ok(parameters[4] === 'dev', 'correct channel')
      tap.ok(parameters[5] === 5, 'correct count')
      cb(null)
    }
  }
  // Build the calling function
  var fn = model.usageUpserter(client, {
    _id: {
      ymd: '2016-01-01',
      platform: 'osx',
      version: '0.10.0',
      channel: 'dev',
      first_time: false
    },
    count: 5
  })
  // Call and complete tests
  fn(function(err) {
    tap.ok(err === null, 'check for error condition')
    clientTest.end()
  })
})
