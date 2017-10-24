/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var common = require('./common')

const BAT_EYESHADE_WALLETS_TOTAL = `
SELECT
  wallets,
  balance,
  funded,
  ( SELECT quote FROM dw.bat_quotes WHERE currency_code = 'USD' ) as btc_usd
FROM
( SELECT
  SUM(wallets)               AS wallets,
  SUM(balance)               AS balance,
  SUM(funded)                AS funded
  FROM dw.fc_bat_wallets_mv ) OVERVIEW
`

// Endpoint definitions
exports.setup = (server, client, mongo) => {
  // Ledger overview summary statistics
  server.route({
    method: 'GET',
    path: '/api/1/bat/ledger_overview',
    handler: common.buildQueryReponseHandler(
      client,
      BAT_EYESHADE_WALLETS_TOTAL,
      (reply, results) => {
        reply({
          wallets: parseInt(results.rows[0].wallets),
          balance: parseFloat(results.rows[0].balance),
          funded: parseInt(results.rows[0].funded),
          bat_usd: parseFloat(results.rows[0].btc_usd)
        })
      }
    )
  })
}
