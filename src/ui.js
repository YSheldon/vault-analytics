const path = require('path')
const UUID = require('uuid-js')
const _ = require('underscore')

var shouldCache = true
if (process.env.LOCAL) {
  shouldCache = false
}

// Setup authentication and user interface components
exports.setup = (server, db) => {
  // The ADMIN_PASSWORD environment variable must be set
  if (!process.env.ADMIN_PASSWORD) {
    throw new Error('ADMIN_PASSWORD not set')
  }

  // The SESSION_SECRET environment variable must be set
  if (!process.env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET not set')
  }

  // Register the server side templates
  server.register(require('vision'), (err) => {
    if (err) {
      throw new Error('vision template handler could not be registered')
    }

    server.views({
      engines: {
        html: require('handlebars')
      },
      isCached: shouldCache,
      relativeTo: path.join(__dirname, '..'),
      path: './views',
      partialsPath: './views/partials',
      layoutPath: './views/layout',
      helpersPath: './views/helpers'
    })
  })

  // Single user for now
  const users = {
    admin: {
      id: 'admin',
      password: process.env.ADMIN_PASSWORD,
      name: 'Administrator'
    }
  }

  // Login handler
  const login = function (request, reply) {
    if (request.auth.isAuthenticated) {
      return reply.redirect('/dashboard#overview')
    }

    let message = ''
    let account = null

    if (request.method === 'post') {
      if (!request.payload.username || !request.payload.password) {
        message = 'Missing username or password'
      } else {
        account = users[request.payload.username]
        if (!account || account.password !== request.payload.password) {
          message = 'Invalid username or password'
        }
      }
    }

    if (request.method === 'get' || message) {
      return reply.view('signin', { message: message })
    }

    const uuid4 = UUID.create()
    const sid = String(uuid4.toString())
    const accountToStore = _.clone(account)
    delete accountToStore.password
    request.server.app.cache.set(sid, { account: accountToStore }, 0, (err) => {
      if (err) {
        reply(err)
      }
      request.cookieAuth.set({ sid: sid })
      return reply.redirect('/dashboard#overview')
    })
  }

  const logout = function (request, reply) {
    request.cookieAuth.clear()
    return reply.redirect('/dashboard#overview')
  }

  // Static directory handling
  server.register(require('inert'), () => {})

  // Auth library
  server.register(require('hapi-auth-cookie'), (err) => {
    if (err) {
      throw new Error(err)
    }

    let cache = require('./catbox-pg').setup(server, { db })
    server.app.cache = cache

    // For local development set LOCAL to true
    var secure = true
    if (process.env.LOCAL) {
      secure = false
    }

    // Auth strategy
    server.auth.strategy('session', 'cookie', true, {
      password: process.env.SESSION_SECRET,
      cookie: 'sid',
      redirectTo: '/login',
      isSecure: secure,
      validateFunc: (request, session, callback) => {
        cache.get(session.sid, (err, cached) => {
          if (err) {
            return callback(err, false)
          }
          if (!cached) {
            return callback(null, false)
          }
          return callback(null, true, cached.account)
        })
      }
    })

    server.route([
      { method: ['GET', 'POST'],
        path: '/login',
        config: {
          handler: login,
          auth: { mode: 'try' },
          plugins: { 'hapi-auth-cookie': { redirectTo: false } } } },
      { method: 'GET',
        path: '/logout',
        config: { handler: logout }}
    ])
  })

  server.route({
    method: 'GET',
    path: '/dashboard',
    handler: function (request, reply) {
      reply.view('dashboard', {
        name: request.auth.credentials.name
      })
    }
  })

  server.route({
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
      reply().redirect('/dashboard#overview')
    }
  })

  // List of static directories and endpoints
  var statics = [
    [ '/bootstrap/{param*}', './node_modules/bootstrap/dist' ],
    [ '/jquery/{param*}', './node_modules/jquery/dist' ],
    [ '/local/{param*}', './local' ],
    [ '/bower/{param*}', './bower_components' ],
    [ '/ss/{param*}', './node_modules/simple-statistics/dist' ]
  ]

  statics.forEach((stat) => {
    server.route({
      method: 'GET',
      path: stat[0],
      config: {
        auth: false
      },
      handler: {
        directory: {
          path: stat[1]
        }
      }
    })
  })
}
