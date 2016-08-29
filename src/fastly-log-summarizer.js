/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const AWS = require('aws-sdk')
const async = require('async')
const logParser = require('./fastly-log-parser')

const S3_LOG_BUCKET = process.env.S3_LOG_BUCKET || 'brave-logs-production'
const S3_LOG_REGION = process.env.S3_LOG_REGION || 'us-east-1'
const S3_UPDATES_KEY = process.env.S3_UPDATES_KEY || 'laptop-updates'

if (!process.env.S3_CRASH_KEY || !process.env.S3_CRASH_SECRET) {
  throw new Error('S3_CRASH_KEY and S3_CRASH_SECRET should be set to the S3 account credentials for storing crash reports')
}

// AWS configuration
AWS.config.update({
  accessKeyId: process.env.S3_CRASH_KEY,
  secretAccessKey: process.env.S3_CRASH_SECRET,
  region: S3_LOG_REGION,
  sslEnabled: true
})

export function recordsForHour (ymd, hour, done) {
  const prefix = `${ymd}T${hour}`
  recordsForPrefix(prefix, done)
}

export function recordsForDay (ymd, done) {
  const prefix = `${ymd}`
  recordsForPrefix(prefix, done)
}

// Retrieve parsed download records with a prefix
export function recordsForPrefix (prefix, done) {
  var s3 = new AWS.S3()
  var allRecords = []

  // Build a function to download the contents of a single log file
  var makeDownloader = function (k, percent) {
    return function (cb) {
      var params = {
        Bucket: S3_LOG_BUCKET,
        Key: k
      }
      s3.getObject(params, function (err, data) {
        if (!err) {
          console.log(percent + '% - Downloading and Parsing ' + k)
          allRecords += "\n" + data.Body.toString()
        }
        cb(err, data)
      })
    }
  }

  var params = {
    Bucket: S3_LOG_BUCKET,
    Prefix: `${S3_UPDATES_KEY}/${prefix}`
  }

  // Retrieve list of log files, parse them and return records as
  // an array of objects
  s3.listObjects(params, function(err, data) {
    if (err) {
      console.log(err, err.stack)
      done(err, null)
    } else {
      console.log(data.Contents.length + ' files to process')
      var funcs = data.Contents.map(function (contents, i) {
        return makeDownloader(contents.Key, Math.round(i / data.Contents.length * 100))
      })
      async.series(funcs, function (asyncError, results) {
        done(asyncError, logParser.parseContents(allRecords))
      })
    }
  })
}
