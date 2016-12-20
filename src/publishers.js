/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var _ = require('underscore')

exports.all = (db, cb) => {
  db.collection('publishers').find().toArray(function (err, rows) {
    if (err) {
      throw err.toString()
    }
    var returnItems = rows.map((row) => {
      row.created_ts = row._id.getTimestamp().getTime() / 1000,
      row.created = (new Date(row.created_ts * 1000)).toISOString().slice(0, 10)
      return row
    })
    var ymdRows = _.groupBy(returnItems, function (row) {
      return row.created
    })
    var ymds = _.map(ymdRows, function (rows, ymd) {
      return {
        ymd: ymd,
        total: rows.length,
        verified: rows.filter(function (rs) { return !!rs.authorized }).length,
        address: rows.filter(function (rs) { return !!rs.address }).length,
        irs: rows.filter(function (rs) { return !!rs.legalFormURL }).length
      }
    })
    cb(err, ymds)
  })
}
