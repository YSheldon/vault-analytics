#!/usr/bin/env node

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const async = require('async')
const amqp = require('amqplib/callback_api')
const elasticsearch = require('elasticsearch')

const pgc = require('../dist/pgc')
const mini = require('../dist/mini')

// RabbitMQ connection parameters
const MQ_URL = process.env.RABBITMQ_BIGWIG_RX_URL || process.env.AMQP_URL || 'amqp://localhost:5672'
const MQ_QUEUE = process.env.MQ_QUEUE || 'crashes'

// ElasticSearch connection parameters
const ES_URL = process.env.SEARCHBOX_URL || 'localhost:9200'
const ES_INDEX = process.env.ES_INDEX || 'crashes'
const ES_TYPE = process.env.ES_TYPE || 'crash'

// Connect to Elastic Search at a host and port
const connectElasticSearch = function(cb) {
  console.log('Connecting to ElasticSearch at ' + ES_URL)
  var es = new elasticsearch.Client({
    host: ES_URL,
    log: null
  })
  cb(null, es)
}

// Connect to messaging system and return a communication channel
const connectAMQP = function(cb) {
  var amqpConnectionString = MQ_URL
  console.log('Connecting to AMQP server at ' + amqpConnectionString)
  amqp.connect(amqpConnectionString, (err, conn) => {
    if (err != null) {
      throw new Error(err)
    }
    console.log('AMQP connection established')
    var on_open = (err, ch) => {
      console.log(`AMQP connected to channel ${MQ_QUEUE}`)
      if (err != null) {
        throw new Error(err)
      }
      ch.prefetch(1)
      ch.assertQueue(MQ_QUEUE, { durable: true })
      cb(err, ch)
    }
    conn.createChannel(on_open)
  })
}

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
                resources.ch.ack(msg)
                cb(null)
              }
            )
          })
      })
    }
  }

  // Start listening for messages
  console.log('All resources available.')
  console.log('Reading messages from AMQP')

  resources.ch.consume(MQ_QUEUE, (msg) => {
    var msgContents = JSON.parse(msg.content.toString())
    console.log(`[${msgContents._id}] ******************** start ********************`)
    buildMessageHandler(msg, msgContents)(function() {
      console.log(`[${msgContents._id}] complete`)
    })
  })
}

// Startup, connect to all required resources and start processing
async.parallel({
  es: connectElasticSearch,
  pg: pgc.setup,
  ch: connectAMQP
}, resourcesReady)
