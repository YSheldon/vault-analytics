/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const async = require('async')

// resources
const pgc = require('../dist/pgc')
const esc = require('../dist/esc')
const amqpc = require('../dist/amqpc')

const mini = require('../dist/mini')

// ElasticSearch
const ES_INDEX = process.env.ES_INDEX || 'crashes'
const ES_TYPE = process.env.ES_TYPE || 'crash'

// This is triggered when connections to all resources are established
const resourcesReady = function (asyncError, resources) {
  if (asyncError) {
    throw new Error(asyncError.toString())
  }

  // Write crash report meta data to Elastic Search (Kibana)
  const writeToElasticSearch = function (id, contents, cb) {
    resources.es.create({
      index: ES_INDEX,
      type: ES_TYPE,
      id: id,
      body: contents
    }, cb)
  }

  // Write crash report meta data to Postgres
  const writeToPostgres = function (id, contents, cb) {
    resources.pg.query(
      'INSERT INTO dtl.crashes (id, contents) VALUES($1, $2) ON CONFLICT (id) DO UPDATE SET contents = $2',
      [id, JSON.stringify(contents)],
      cb
    )
  }

  // Build a function capable of retrieving the crash report,
  // parsing and writing it to Postgres and ES
  function buildMessageHandler (msg, msgContents) {
    return function (cb) {
      console.log(`[${msgContents._id}] parsing crash report`)
      // Read crash report from S3 and parse with minidump
      // (which handles Symbol substitution)
      mini.readAndParse(msgContents._id, (miniError, crashReport, metadata) => {
        crashReport = crashReport.toString()

        // install the parser minidump metadata into the crash report
        msgContents.metadata = metadata

        // Write the record to Postgres
        writeToPostgres(
          msgContents._id,
          msgContents,
          function(pgErr, results) {
            if (pgErr) {
              console.log(pgErr.toString())
            }
            console.log(`[${msgContents._id}] written to Postgres`)

            // Write the record to Elastic Search
            writeToElasticSearch(
              msgContents._id,
              // We need to store the crash in a 'crash' attribute because
              // the _ver field collides with ElasticSearch
              { crash: msgContents },
              function (esErr, response) {
                if (esErr) {
                  console.log(esErr.toString())
                }
                console.log(`[${msgContents._id}] indexed in ElasticSearch`)
                // done, ack the message and callback
                mini.writeParsedCrashToS3(msgContents._id, crashReport, function (s3WriteError) {
                  if (esErr) {
                    console.log(s3WriteError.toString())
                  }
                  resources.ch.ack(msg)
                  cb(null)
                })
              }
            )
          })
      })
    }
  }

  // Start listening for messages
  console.log('All resources available.')
  console.log('Reading messages from AMQP')

  // Read messages from queue
  resources.ch.consume(resources.ch.queueName, (msg) => {
    var msgContents = JSON.parse(msg.content.toString())
    console.log(`[${msgContents._id}] ******************** start ********************`)
    var handler = buildMessageHandler(msg, msgContents)
    handler(function(err) {
      console.log(`[${msgContents._id}] complete`)
    })
  })
}

// Startup, connect to all required resources and start processing
async.parallel({
  es: esc.setup,
  pg: pgc.setup,
  ch: amqpc.setup
}, resourcesReady)
