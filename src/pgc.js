const pg = require('pg')

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL must be set to the Postgres connection URL')
}

exports.setup = (done) => {
  console.log('Connecting to Postgres at ' + DATABASE_URL)
  // Connect to postgres
  pg.connect(DATABASE_URL, function (err, client) {
    if (err) throw err
    done(err, client)
  })
}
