#!/usr/bin/env node

var pgc = require('../dist/pgc')
var tap = require('tap')

var testCount = 0

pgc.setup(function(err, pg) {
  tap.test('sp.comparable_version - value', function(t) {
    pg.query("SELECT sp.comparable_version('1.2.3') AS version", [], function (err, results) {
      t.equal(results.rows[0].version, '10020003', 'value')
      testCount += 1
      t.end()
    })
  })

  tap.test('sp.comparable_version - comparison', function(t) {
    pg.query("SELECT sp.comparable_version('0.11.5') > sp.comparable_version('0.9.0') AS comp", [], function (err, results) {
      t.equal(results.rows[0].comp, true, 'comparison')
      testCount += 1
      t.end()
    })
  })

  setInterval(function () {
    if (testCount === 2) {
      pg.end()
      process.exit(0)
    }
  }, 500)
})
