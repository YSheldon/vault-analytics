/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var _ = require('underscore')
var common = require('./common')

const EYESHADE_WALLETS = `
SELECT
  TO_CHAR(FC.created, 'YYYY-MM-DD') AS ymd,
  FC.wallets AS count
FROM dw.fc_wallets_mv FC
WHERE
  FC.created >= GREATEST(current_date - CAST($1 as INTERVAL), '2016-01-26'::date)
ORDER BY FC.created DESC
`

const EYESHADE_FUNDED_WALLETS = `
SELECT
  TO_CHAR(FC.created, 'YYYY-MM-DD') AS ymd,
  FC.funded AS count
FROM dw.fc_wallets_mv FC
WHERE
  FC.created >= GREATEST(current_date - CAST($1 as INTERVAL), '2016-01-26'::date)
ORDER BY FC.created DESC
`

const EYESHADE_FUNDED_WALLETS_PERCENTAGE = `
SELECT
  TO_CHAR(FC.created, 'YYYY-MM-DD') AS ymd,
  ROUND(((FC.funded + 0.0) / GREATEST(FC.wallets + 0.0, 1.0)) * 100, 1) AS count
FROM dw.fc_wallets_mv FC
WHERE
  FC.created >= GREATEST(current_date - CAST($1 as INTERVAL), '2016-09-01'::date)
ORDER BY FC.created DESC
`

const EYESHADE_FUNDED_WALLETS_BALANCE = `
SELECT
  TO_CHAR(FC.created, 'YYYY-MM-DD') AS ymd,
  ROUND(FC.balance / 100000000.0, 3) AS count
FROM dw.fc_wallets_mv FC
WHERE
  FC.created >= GREATEST(current_date - CAST($1 as INTERVAL), '2016-01-26'::date)
ORDER BY FC.created DESC
`

const EYESHADE_FUNDED_WALLETS_BALANCE_AVERAGE = `
SELECT
  TO_CHAR(FC.created, 'YYYY-MM-DD') AS ymd,
  ROUND(FC.balance / GREATEST(FC.funded, 1.0) / 100000000.0, 3) AS count
FROM dw.fc_wallets_mv FC
WHERE
  FC.created >= GREATEST(current_date - CAST($1 as INTERVAL), '2016-09-01'::date)
ORDER BY FC.created DESC
`

const EYESHADE_WALLETS_TOTAL = `
SELECT
  wallets,
  balance,
  funded,
  ( SELECT quote FROM dw.btc_quotes WHERE currency_code = 'USD' ) as btc_usd
FROM
( SELECT
  SUM(wallets)               AS wallets,
  SUM(balance)               AS balance,
  SUM(funded)                AS funded
  FROM dw.fc_wallets_mv ) OVERVIEW
`

/*
  Build a response handler using a default set of success and param generators

  client - Postgres client connection
  query  - SQL to execute
  successHandler - function(reply, results, request) -> Null
  function to handle sending results to the reply function
  paramsBuilder - function(request) -> Array
  function to build a set of SQL params for query
*/
const buildQueryReponseHandler = (client, query, successHandler, paramsBuilder) => {
  paramsBuilder = paramsBuilder || ((request) => { return [] })
  successHandler = successHandler || ((reply, results) => { reply(results.rows) })
  return (request, reply) => {
    const params = paramsBuilder(request)
    client.query(query, params, (err, results) => {
      if (err) {
        reply(err.toString()).code(500)
      } else {
        successHandler(reply, results, request)
      }
    })
  }
}

// Data endpoints
exports.setup = (server, client, mongo) => {

  // Eyeshade / ledger wallets by day
  server.route({
    method: 'GET',
    path: '/api/1/eyeshade_wallets',
    handler: buildQueryReponseHandler(
      client,
      EYESHADE_WALLETS,
      (reply, results, request) => {
        results.rows.forEach((row) => common.formatPGRow(row))
        results.rows = common.potentiallyFilterToday(results.rows, request.query.showToday === 'true')
        reply(results.rows)
      },
      (request) => { return [parseInt(request.query.days || 7) + ' days'] }
    )
  })

  // Eyeshade / ledger funded wallets by day
  server.route({
    method: 'GET',
    path: '/api/1/eyeshade_funded_wallets',
    handler: function (request, reply) {
      let days = parseInt(request.query.days || 7, 10)
      days += ' days'
      client.query(EYESHADE_FUNDED_WALLETS, [days], (err, results) => {
        if (err) {
          reply(err.toString()).code(500)
        } else {
          results.rows.forEach((row) => common.formatPGRow(row))
          results.rows = common.potentiallyFilterToday(results.rows, request.query.showToday === 'true')
          reply(results.rows)
        }
      })
    }
  })

  // Eyeshade / ledger funded wallets by day
  server.route({
    method: 'GET',
    path: '/api/1/eyeshade_funded_percentage_wallets',
    handler: function (request, reply) {
      let days = parseInt(request.query.days || 7, 10)
      days += ' days'
      client.query(EYESHADE_FUNDED_WALLETS_PERCENTAGE, [days], (err, results) => {
        if (err) {
          reply(err.toString()).code(500)
        } else {
          results.rows.forEach((row) => row.count = parseFloat(row.count))
          results.rows = common.potentiallyFilterToday(results.rows, request.query.showToday === 'true')
          reply(results.rows)
        }
      })
    }
  })

  // Eyeshade / ledger funded wallets by day
  server.route({
    method: 'GET',
    path: '/api/1/eyeshade_funded_balance_wallets',
    handler: function (request, reply) {
      let days = parseInt(request.query.days || 7, 10)
      days += ' days'
      client.query(EYESHADE_FUNDED_WALLETS_BALANCE, [days], (err, results) => {
        if (err) {
          reply(err.toString()).code(500)
        } else {
          results.rows.forEach((row) => row.count = parseFloat(row.count))
          results.rows = common.potentiallyFilterToday(results.rows, request.query.showToday === 'true')
          reply(results.rows)
        }
      })
    }
  })

  // Eyeshade / ledger funded wallets by day
  server.route({
    method: 'GET',
    path: '/api/1/eyeshade_funded_balance_average_wallets',
    handler: function (request, reply) {
      let days = parseInt(request.query.days || 7, 10)
      days += ' days'
      client.query(EYESHADE_FUNDED_WALLETS_BALANCE_AVERAGE, [days], (err, results) => {
        if (err) {
          reply(err.toString()).code(500)
        } else {
          results.rows.forEach((row) => row.count = parseFloat(row.count), 3)
          results.rows = common.potentiallyFilterToday(results.rows, request.query.showToday === 'true')
          reply(results.rows)
        }
      })
    }
  })

  // Ledger overview summary statistics
  server.route({
    method: 'GET',
    path: '/api/1/ledger_overview',
    handler: buildQueryReponseHandler(client, EYESHADE_WALLETS_TOTAL, (reply, results) => {
      reply({
        wallets: parseInt(results.rows[0].wallets),
        balance: parseInt(results.rows[0].balance),
        funded: parseInt(results.rows[0].funded),
        btc_usd: parseFloat(results.rows[0].btc_usd)
      })
    })
  })
}
