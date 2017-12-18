/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var common = require('./common')
var _ = require('underscore')
var Joi = require('joi')

const ALL_PROMOTIONS = 'SELECT * FROM dtl.promotions ORDER BY ref'
const ALL_PARTNERS = 'SELECT partner FROM dtl.promotions GROUP BY partner'

// Endpoint definitions
exports.setup = (server, client, mongo) => {
  // all promotions
  server.route({
    method: 'GET',
    path: '/api/1/promotions/refs',
    handler: common.buildQueryReponseHandler(
      client,
      ALL_PROMOTIONS,
      (reply, results, request) => {
        reply(results.rows)
      },
      (request) => { return [] }
    )
  })

  // all promotions
  server.route({
    method: 'GET',
    path: '/api/1/promotions/partners',
    handler: common.buildQueryReponseHandler(
      client,
      ALL_PARTNERS,
      (reply, results, request) => {
        reply(results.rows)
      },
      (request) => { return [] }
    )
  })

  // POST new promotion
  server.route({
    method: 'POST',
    path: '/api/1/promotions/refs',
    handler: async function (request, reply) {
      try {
        var result = await client.query("INSERT INTO dtl.promotions ( partner, ref, description, platform ) VALUES ( $1, $2, $3, $4 )", [request.payload.partner, request.payload.ref, request.payload.description, request.payload.platform || 'publisher']) 
        var row = (await client.query("SELECT * FROM dtl.promotions WHERE ref = $1", [request.params.ref])).rows[0]
        reply(row)
      } catch (e) {
        reply(e.toString()).code(500) 
      }
    },
    config: {
      validate: {
        payload: {
          partner: Joi.string().required(),
          ref: Joi.string().required(),
          description: Joi.string().required(),
          platform: Joi.string().required()
        }
      }
    }
  })
}
