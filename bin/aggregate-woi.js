#!/usr/bin/env node

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const _ = require('underscore')
const pg = require('pg')
const mongoc = require('../dist/mongoc')
const retriever = require('../dist/retriever')
const util = require('util')

const collections = ['usage', 'android_usage', 'ios_usage']

const QUERY = `
INSERT INTO dw.fc_retention_woi (ymd, platform, version, channel, woi, ref, total)
VALUES ($1, $2, $3, $4, $5, $6, $7)
ON CONFLICT (ymd, platform, version, channel, woi, ref) DO UPDATE SET total = EXCLUDED.total
`

async function run (args) {
  var i, j, results, row
  try {
    const db = await pg.connect(process.env.DATABASE_URL)
    const mg = await mongoc.setupConnection()

    for (i = 0; i < collections.length; i++) {
      results = await retriever.aggregatedWOI(mg, collections[i], 2)
      console.log(`Aggregating ${results.length} records from ${collections[i]}`)
      for (j = 0; j < results.length; j++) {
        row = results[j]._id
        row.total = results[j].count
        if (row.version.match(new RegExp("^\\d+\\.\\d+\\.\\d+$"))) {
          await db.query(QUERY, [row.ymd, row.platform, row.version, row.channel, row.woi, row.ref, row.total])
        } else {
          console.log("Ignoring row because of version error " + util.inspect(row))
        }
      }
    }
    console.log("Done")
    mg.close()
    db.end()
  } catch (e) {
    console.log(e)
    process.exit(1)
  }
}

run()
