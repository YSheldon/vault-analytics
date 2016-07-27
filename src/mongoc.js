/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const assert = require('assert')
const MongoClient = require('mongodb').MongoClient

const mongoURL = process.env.MONGOLAB_URI
if (!mongoURL) throw new Error('MONGOLAB_URI must be set in environment')

export function setup (cb) {
  console.log('Connecting to Mongo at ' + mongoURL)
  MongoClient.connect(mongoURL, (err, connection) => {
    assert.equal(null, err)
    cb(err, connection)
  })
}
