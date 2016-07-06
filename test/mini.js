var tap = require('tap')
var _ = require('underscore')

// Check for environment variables
tap.throw(function() {
  require('../dist/mini')
}, /S3_CRASH_KEY/g, "mini requires S3 environment variables")

process.env.S3_CRASH_KEY = 'XXX'
process.env.S3_CRASH_SECRET = 'XXX'

// Require the mini module
var mini = require('../dist/mini')
tap.ok(mini.parsePlainTextMinidump, 'Require successful')

// Retrieve metadata from the crash report
var crashReport = "Crash reason: Some Reason\n\nAssertion: Some assertion\nCPU: AMD\n"
var meta = mini.parsePlainTextMinidump(crashReport)
tap.ok(meta.crash_reason === 'Some Reason', 'grabbers working as expected')

// Async test for successfully parsing crash dump
tap.test('Parse existing crash dump', function (childTest) {
  mini.fileDumpHandler('./test/fixtures/dumps/56c5e4ef2a335d11003ceeef', function (err, crashReport, metadata) {
    tap.ok(crashReport, 'crash report generated')
    tap.ok(_.isObject(metadata), 'metadata is an object')
    tap.ok(metadata.crash_reason, 'Crash reason extracted')
    childTest.end()
  })()
})

// Async test for unsuccessfully parsing crash dump
tap.test('Parse existing crash dump', function (childTest) {
  mini.fileDumpHandler('./test/fixtures/dumps/XXX', function (err, crashReport, metadata) {
    tap.ok(crashReport === '', 'crash report not generated')
    tap.ok(_.isObject(metadata), 'metadata is an object')
    tap.ok(metadata.crash_reason === undefined, 'Crash reason not extracted')
    childTest.end()
  })()
})
