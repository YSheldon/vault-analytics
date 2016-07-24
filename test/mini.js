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
tap.ok(mini.metadataFromMachineCrash, 'Require successful')

// Async test for successfully parsing win32 crash dump
tap.test('Parse existing win32 crash dump', function (childTest) {
  mini.parseCrashHandler('./test/fixtures/dumps/56c5e4ef2a335d11003ceeef', function (err, crashReport, metadata) {
    childTest.ok(crashReport, 'crash report generated')
    childTest.ok(_.isObject(metadata), 'metadata is an object')
    childTest.ok(metadata.crash_reason, 'Crash reason extracted')
    childTest.ok(metadata.crash_address === '0x30', 'Crash address extracted')
    childTest.end()
  })
})

// Async test for successfully parsing linux crash dump
tap.test('Parse existing linux crash dump', function (childTest) {
  mini.parseCrashHandler('./test/fixtures/dumps/578d22d769ba5c1100e09713', function (err, crashReport, metadata) {
    childTest.ok(crashReport, 'crash report generated')
    childTest.ok(_.isObject(metadata), 'metadata is an object')
    childTest.ok(metadata.crash_reason, 'Crash reason extracted')
    childTest.equal(metadata.operating_system, 'Linux', 'operating_system extracted')
    childTest.end()
  })
})

// Async test for unsuccessfully parsing crash dump
tap.test('Parse invalid crash dump', function (childTest) {
  mini.parseCrashHandler('./test/fixtures/dumps/XXX', function (err, crashReport, metadata) {
    childTest.ok(crashReport === '', 'crash report not generated')
    childTest.ok(_.isObject(metadata), 'metadata is an object')
    childTest.ok(metadata.crash_reason === undefined, 'Crash reason not extracted')
    childTest.end()
  })
})

tap.test('Windows OS version', function (childTest) {
  childTest.equal(mini.matchWindowsOperatingSystem('6.1.7600'), 'Windows 7')
  childTest.equal(mini.matchWindowsOperatingSystem('5.1.0056'), 'Windows XP')
  childTest.equal(mini.matchWindowsOperatingSystem('9.0'), 'unknown', 'no match')
  childTest.end()
})
