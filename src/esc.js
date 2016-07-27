/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const elasticsearch = require('elasticsearch')

// ElasticSearch connection parameters
const ES_URL = process.env.SEARCHBOX_URL || 'localhost:9200'

// Connect to Elastic Search at a host and port
export function setup (cb) {
  console.log('Connecting to ElasticSearch at ' + ES_URL)
  var es = new elasticsearch.Client({
    host: ES_URL,
    log: null
  })
  cb(null, es)
}

