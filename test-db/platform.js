#!/usr/bin/env node

var pgc = require('../dist/pgc')
var tap = require('tap')

var testCount = 0

pgc.setup(function(err, pg) {
  console.log('Connected')

  tap.test('sp.canonical_platform - darwin', function(t) {
    pg.query("SELECT sp.canonical_platform('darwin', 'amd64') AS platform", [], function (err, results) {
      t.equal(results.rows[0].platform, 'osx', 'osx')
      testCount += 1
      t.end()
    })
  })

  tap.test('sp.canonical_platform - linux', function(t) {
    pg.query("SELECT sp.canonical_platform('linux', 'amd64') AS platform", [], function (err, results) {
      t.equal(results.rows[0].platform, 'linux', 'linux')
      testCount += 1
      t.end()
    })
  })

  tap.test('sp.canonical_platform - winx64', function(t) {
    pg.query("SELECT sp.canonical_platform('win32', 'amd64') AS platform", [], function (err, results) {
      t.equal(results.rows[0].platform, 'winx64', 'winx64')
      testCount += 1
      t.end()
    })
  })

  tap.test('sp.canonical_platform - winia32', function(t) {
    pg.query("SELECT sp.canonical_platform('win32', 'x86') AS platform", [], function (err, results) {
      t.equal(results.rows[0].platform, 'winia32', 'winia32')
      testCount += 1
      t.end()
    })
  })

  tap.test('sp.canonical_platform - other', function(t) {
    pg.query("SELECT sp.canonical_platform('other', 'amd64') AS platform", [], function (err, results) {
      t.equal(results.rows[0].platform, 'other', 'other')
      testCount += 1
      t.end()
    })
  })

  tap.test('sp.platform_mapping - unknown', function(t) {
    pg.query("SELECT sp.platform_mapping('unknown') AS platform", [], function (err, results) {
      t.equal(results.rows[0].platform, 'linux', 'unknown')
      testCount += 1
      t.end()
    })
  })

  tap.test('sp.platform_mapping - osx', function(t) {
    pg.query("SELECT sp.platform_mapping('osx') AS platform", [], function (err, results) {
      t.equal(results.rows[0].platform, 'osx', 'osx')
      testCount += 1
      t.end()
    })
  })

  setInterval(function () {
    if (testCount === 7) {
      pg.end()
      process.exit(0)
    }
  }, 500)
})
