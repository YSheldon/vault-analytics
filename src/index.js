let Hapi = require('hapi')
let Inert = require('inert')
let assert = require('assert')
let async = require('async')

let ui = require('./ui')
let api = require('./api')

let setGlobalHeader = require('hapi-set-header')

let profile = process.env.NODE_ENV || 'development'
let config = require('../config/config.' + profile + '.js')

let pgc = require('./pgc')
let mgc = require('./mongoc')

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

  // Handle the boom response as well as all other requests (cache control for telemetry)
  setGlobalHeader(server, 'Cache-Control', 'no-cache, no-store, must-revalidate, private, max-age=0')
  setGlobalHeader(server, 'Pragma', 'no-cache')
  setGlobalHeader(server, 'Expires', 0)

  connection.listener.once('clientError', function (e) {
    console.error(e)
  })

  // Setup the API
  api.setup(server, connections.pg, connections.mg)

  // Setup the UI for the dashboard
  ui.setup(server)

  server.start((err) => {
    assert(!err, `error starting service ${err}`)
    console.log('Analytics service started')
  })
}

// Connect to postgres and mongo
async.parallel(
  {
    pg: pgc.setup,
    mg: mgc.setup
  },
  kickoff
)

