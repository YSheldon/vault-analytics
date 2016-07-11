var tap = require('tap')
var _ = require('underscore')

var reporter = require('../dist/reporter')

var job = reporter.startup('JOB1')
tap.equal(job.id, 'JOB1', 'identifier retained')
tap.ok(_.isNumber(job.ts), 'ts is a number')

tap.test('shutdown', function (clientTest) {
  var db = {
    count: 0,
    query: function (sql, params, cb) {
      // First call (store duration)
      if (db.count === 0) {
        db.count += 1
        tap.ok(sql.match(/^INSERT INTO/), 'insert statement')
        tap.ok(params[0] === 'JOB1', 'correct identifier')
        tap.ok(_.isNumber(params[1]), 'duration is a number')
        cb(null)
      } else {
      // Second call (remove old reports)
        tap.ok(sql.match(/^DELETE FROM/), 'delete from')
        cb(null)
      }
    }
  }
  setTimeout(function() {
    reporter.shutdown(job, db, function () {
      clientTest.end()
    })
  }, 1750)
})
