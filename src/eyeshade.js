#!/usr/bin/env node

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

exports.walletsCreatedByDay = (db, cb) => {
  var query = db.collection('wallets').aggregate([
    {
      $project: {
        ymd: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
      }
    },
    {
      $group: {
        _id: {
          ymd: '$ymd'
        },
        count: {
          $sum: 1
        }
      }
    },
  ])
  query.toArray(cb)
}
