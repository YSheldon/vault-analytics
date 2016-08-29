var tap = require('tap')
var fastly = require('../dist/fastly-log-parser')

tap.test('fastly log file parsing', function (t) {
  var rows = fastly.parseFile('./test/fixtures/fastly-logs/sample-set.txt')
  t.equal(rows.length, 9, 'parsed row count')

  var summary = fastly.groupedSummaryBy(rows, ['countryCode', 'daily'])
  var row = summary.filter(function(row) {
    return row.countryCode === 'US' && row.daily
  })[0]
  t.equal(row.count, 2, 'US daily use')

  summary = fastly.groupedSummaryBy(rows, ['countryCode'])
  row = summary.filter(function(row) {
    return row.countryCode === 'US'
  })[0]
  t.equal(row.count, 6, 'US all')

  summary = fastly.groupedSummaryBy(rows, ['dmaCode'], { countryCode: 'US', daily: true })
  row = summary.filter(function(row) {
    return row.dmaCode === '611'
  })[0]
  t.equal(row.count, 1, 'multiple predicate and group')

  t.end()
})
