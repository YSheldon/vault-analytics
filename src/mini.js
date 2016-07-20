/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */
var minidump = require('minidump')
var AWS = require('aws-sdk')

const S3_CRASH_BUCKET = process.env.S3_CRASH_BUCKET || 'brave-laptop-crash-reports'
const S3_CRASH_REGION = process.env.S3_CRASH_REGION || 'us-west-2'
const WALK_DELAY = parseInt(process.env.WALK_DELAY || 2000)

if (!process.env.S3_CRASH_KEY || !process.env.S3_CRASH_SECRET) {
  throw new Error('S3_CRASH_KEY and S3_CRASH_SECRET should be set to the S3 account credentials for storing crash reports')
}

// AWS configuration
AWS.config.update({
  accessKeyId: process.env.S3_CRASH_KEY,
  secretAccessKey: process.env.S3_CRASH_SECRET,
  region: S3_CRASH_REGION,
  sslEnabled: true
})

// Walk the stack for an existing file and extract metadata
exports.fileDumpHandler = (filename, cb) => {
  return () => {
    // Walk the stack generating the plain text crash report
    minidump.walkStack(filename, require('electron-debug-symbols').paths , (err, results) => {
      var metadata = {}
      if (results) {
        // Retrieve metadata from the plain text minidump
        metadata = exports.parsePlainTextMinidump(results.toString())
      } else {
        console.log(err)
        console.log('Note: Invalid crash report - no metadata extracted')
      }
      // Pass through the error the crash dump and the extracted metadata
      cb(err, results || "", metadata)
    })
  }
}

// Retrieve a binary minidump file from S3, parse it, and
// substitute symbols
exports.readAndParse = (id, delay, cb) => {
  delay = delay || WALK_DELAY
  var s3 = new AWS.S3()
  var params = {
    Bucket: S3_CRASH_BUCKET,
    Key: id
  }
  var filename = '/tmp/' + id
  var file = require('fs').createWriteStream(filename)

  console.log('Reading dump file from bucket ' + S3_CRASH_BUCKET + ' with id ' + id)

  s3.getObject(params).
    on('httpData', function(chunk) { file.write(chunk) }).
    on('httpDone', function() {
      console.log('Delaying processing by ' + delay)
      setTimeout(function () {
        exports.fileDumpHandler(filename, cb)()
      }, delay)
    }).
    on('error', function(err) {
      console.log("Error retrieving crash report from S3")
      throw new Error(err)
      cb(err)
    }).
    send()
}

// Retrieve a binary minidump file from S3
exports.readAndStore = (id, cb) => {
  var s3 = new AWS.S3()
  var params = {
    Bucket: S3_CRASH_BUCKET,
    Key: id
  }
  var filename = '/tmp/' + id
  var file = require('fs').createWriteStream(filename)

  console.log('Reading dump file from bucket ' + S3_CRASH_BUCKET + ' with id ' + id)

  s3.getObject(params).
    on('httpData', function(chunk) { file.write(chunk) }).
    on('httpDone', function() { cb(filename) }).
    on('error', function(err) {
      console.log("Error retrieving crash report from S3")
      throw new Error(err)
      cb(err)
    }).
    send()
}

// Grab bits of information from the plain text minidump
// file and return in an object using the grabber regexp
exports.parsePlainTextMinidump = (contents) => {
  // Keys and regexps for retrieving pieces of information from the
  // plain text minidump
  var grabbers = [
    ['crash_reason', new RegExp('^Crash reason: (.*)\n', 'gm')],
    ['crash_address', new RegExp('^Crash address: (.*)\n', 'gm')],
    ['assertion', new RegExp('^Assertion: (.*)\n', 'gm')],
    ['process_uptime', new RegExp('^Process uptime: (.*)\n', 'gm')],
    ['operating_system', new RegExp('^Operating system: (.*)\n', 'gm')],
    ['cpu', new RegExp('^CPU: (.*)\n', 'gm')]
  ]
  var results = {}
  grabbers.forEach((grabber) => {
    var match = grabber[1].exec(contents)
    if (match) {
      results[grabber[0]] = match[1].trim()
    } else {
      console.log(`No match on ${grabber[0]}`)
    }
  })
  return results
}

const windowsVersionMatchers = [
  ['5.0', 'Windows 2000'],
  ['5.1', 'Windows XP or Windows XP 64-Bit Edition Version 2002 (Itanium)'],
  ['5.2', 'Windows Server 2003 or Windows XP x64 Edition (AMD64/EM64T) or Windows XP 64-Bit Edition Version 2003 (Itanium)'],
  ['6.0.6000', 'Windows Vista'],
  ['6.0.6001', 'Windows Vista SP1 or Windows Server 2008'],
  ['6.1.7600', 'Windows 7 or Windows Server 2008 R2'],
  ['6.1.7601', 'Windows 7 SP1 or Windows Server 2008 R2 SP1'],
  ['6.2', 'Windows 8 or Windows Server 2012'],
  ['6.3.92', 'Windows 8.1 or Windows Server 2012 R2'],
  ['6.3.96', 'Windows 8.1 with Update 1'],
  ['10', 'Windows 10']
]

// Match a Windows operating system version to a label
export function matchWindowsOperatingSystem (os) {
  var matches = windowsVersionMatchers.filter((matcher) => {
    return os.match(new RegExp(`^${matcher[0]}`))
  })
  if (matches.length) {
    return matches[0][1]
  } else {
    return null
  }
}
