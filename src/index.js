/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

let path = require('path')
let _ = require('underscore')

let Hapi = require('hapi')
let Inert = require('inert')
let assert = require('assert')
let async = require('async')

let ui = require('./ui')

// API Endpoints
let jobs = require('./api/jobs')
let stats = require('./api/stats')
let crashes = require('./api/crashes')
let search = require('./api/search')
let eyeshade = require('./api/eyeshade')
let bat_eyeshade = require('./api/bat_eyeshade')
let publishers = require('./api/publishers')
let telemetry = require('./api/telemetry')

let setGlobalHeader = require('hapi-set-header')

let profile = process.env.NODE_ENV || 'development'
let config = require('../config/config.' + profile + '.js')

let pgc = require('./pgc')
let mgc = require('./mongoc')

let slack = require('./slack')
let npminfo = require(path.join(__dirname, '..', 'package'))
config.npminfo = _.pick(npminfo, 'name', 'version', 'description', 'author', 'license', 'bugs', 'homepage')

// This is fired after all resources connected
let kickoff = (err, connections) => {
  if (err) {
    throw new Error(err)
  }
  let server = new Hapi.Server()
  let connection = server.connection({
    host: config.host,
    port: config.port
  })
  server.register(Inert, function () {})
  server.register(require('blipp'), function () {})

  // Handle the boom response as well as all other requests (cache control for telemetry)
  setGlobalHeader(server, 'Cache-Control', 'no-cache, no-store, must-revalidate, private, max-age=0')
  setGlobalHeader(server, 'Pragma', 'no-cache')
  setGlobalHeader(server, 'Expires', 0)

  connection.listener.once('clientError', function (e) {
    console.error(e)
  })

  // Setup the APIs
  _.each([stats, jobs, crashes, search, eyeshade, bat_eyeshade, publishers, telemetry], (api) => { api.setup(server, connections.pg, connections.mg) })

  // Setup the UI for the dashboard
  ui.setup(server)
  slack.setup(server, config)

  server.start((err) => {
    assert(!err, `error starting service ${err}`)
    console.log('Analytics service started')
    slack.notify( { text: require('os').hostname() + ' ' + npminfo.name + '@' + npminfo.version + ' started' } )
  })
}

// Connect to Postgres and Mongo
async.parallel(
  {
    pg: pgc.setup,
    mg: mgc.setup
  },
  kickoff
)
