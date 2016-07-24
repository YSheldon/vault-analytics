const AWS = require('aws-sdk')
const path = require('path')
const fs = require('fs')

const flp = require('../dist/fastly-log-parser')

const S3_LOG_BUCKET = process.env.S3_LOG_BUCKET || 'brave-logs-production'
const S3_LOG_REGION = process.env.S3_LOG_REGION || 'us-east-1'

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

export function listLogsInFolder (folderName, ymd, cb) {
  var s3 = new AWS.S3()
  var params = {
    Bucket: S3_LOG_BUCKET,
    Prefix: `${folderName}/${ymd}`
  };
  s3.listObjectsV2(params, function(err, data) {
    if (err) {
      throw new Error(err.stack)
    }
    cb(data.Contents)
  })
}

//listLogsInFolder('laptop-updates', (files) => {
//  console.log(files)
//  console.log(files.length)
//})

export function downloadLogfile(identifier, cb) {
  var s3 = new AWS.S3()
  var params = {
    Bucket: S3_LOG_BUCKET,
    Key: identifier
  }
  
  var filename = '/tmp/' + path.basename(identifier)
  var file = require('fs').createWriteStream(filename)
  s3.getObject(params).
    on('httpData', function(chunk) { file.write(chunk) }).
    on('httpDone', function() {
      fs.readFile(filename, (err, contents) => {
        cb(filename)
      })
    }).
    on('error', function(err) {
      console.log("Error retrieving log file from S3")
      throw new Error(err)
      cb(err)
    }).
    send()
}

export function processLogsForDate(ymd, aggregator, cb) {
  listLogsInFolder('laptop-updates', (files) => {
    
  })
}

function identityAggregator (rows) { return rows }

downloadLogfile('laptop-updates/2016-06-13T08:00:00.000-_jeJbnLervJ7vT8AAAAA.log', (filename) => {
  console.log(flp.parseFile(filename))
})
