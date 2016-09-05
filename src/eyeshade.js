/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

exports.wallets = (db, cb) => {
  db.collection('wallets').find().toArray(function(err, items) {
    if (err) {
      throw err.toString()
    }
    var returnItems = items.map((item) => {
      var toReturn = {
        id: item._id,
        created_ts: item._id.getTimestamp().getTime() / 1000,
        updated_ts: item.timestamp.getHighBits(),
        financial_balance: 0,
        financial_spendable: 0,
        financial_confirmed: 0,
        financial_unconfirmed: 0
      }
      toReturn.created = (new Date(toReturn.created_ts * 1000)).toISOString().slice(0, 10)
      toReturn.updated = (new Date(toReturn.updated_ts * 1000)).toISOString().slice(0, 10)
      if (item.balances) {
        toReturn.financial_balance = item.balances.balance
        toReturn.financial_spendable = item.balances.spendable
        toReturn.financial_confirmed = item.balances.confirmed
        toReturn.financial_unconfirmed = item.balances.unconfirmed
      }
      return toReturn
    })
    cb(err, returnItems)
  })
}
