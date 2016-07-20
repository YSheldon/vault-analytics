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

// Async test for successfully parsing win32 crash dump
tap.test('Parse existing win32 crash dump', function (childTest) {
  mini.fileDumpHandler('./test/fixtures/dumps/56c5e4ef2a335d11003ceeef', function (err, crashReport, metadata) {
    childTest.ok(crashReport, 'crash report generated')
    childTest.ok(_.isObject(metadata), 'metadata is an object')
    childTest.ok(metadata.crash_reason, 'Crash reason extracted')
    childTest.ok(metadata.crash_address === '0x30', 'Crash address extracted')
    childTest.end()
  })()
})

// Async test for successfully parsing linux crash dump
tap.test('Parse existing linux crash dump', function (childTest) {
  mini.fileDumpHandler('./test/fixtures/dumps/578d22d769ba5c1100e09713', function (err, crashReport, metadata) {
    childTest.ok(crashReport, 'crash report generated')
    childTest.ok(_.isObject(metadata), 'metadata is an object')
    childTest.ok(metadata.crash_reason, 'Crash reason extracted')
    childTest.equal(metadata.operating_system, 'Linux', 'operating_system extracted')
    childTest.end()
  })()
})

// Async test for unsuccessfully parsing crash dump
tap.test('Parse invalid crash dump', function (childTest) {
  mini.fileDumpHandler('./test/fixtures/dumps/XXX', function (err, crashReport, metadata) {
    childTest.ok(crashReport === '', 'crash report not generated')
    childTest.ok(_.isObject(metadata), 'metadata is an object')
    childTest.ok(metadata.crash_reason === undefined, 'Crash reason not extracted')
    childTest.end()
  })()
})

tap.test('Windows OS version', function (childTest) {
  childTest.equal(mini.matchWindowsOperatingSystem('6.1.7600'), 'Windows 7 or Windows Server 2008 R2', 'Exact match')
  childTest.equal(mini.matchWindowsOperatingSystem('5.1.0056'), 'Windows XP or Windows XP 64-Bit Edition Version 2002 (Itanium)', 'partial match')
  childTest.equal(mini.matchWindowsOperatingSystem('9.0'), null, 'no match')
  childTest.end()
})
