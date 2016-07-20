var tap = require('tap')
var fastly = require('../dist/fastly-log-parser')

tap.test('fastly log file parsing', function (t) {
  var rows = fastly.parseFile('./test/fixtures/fastly-logs/sample-set.txt')
  t.equal(rows.length, 9, 'parsed row count')
  var summary = fastly.groupedSummaryBy(rows, ['countryCode', 'daily'])
  t.equal(summary['US,true'], 2, 'US daily use')
  summary = fastly.groupedSummaryBy(rows, ['countryCode'])
  t.equal(summary['US'], 6, 'US all')
  summary = fastly.groupedSummaryBy(rows, ['dmaCode'], { countryCode: 'US', daily: true })
  t.equal(summary[611], 1, 'multiple predicate and group')
  t.end()
})
