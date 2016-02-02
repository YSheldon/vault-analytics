const pg = require('pg')

const PG_URL = process.env.PG_URL
if (!PG_URL) {
  throw new Error('PG_URL must be set to the Postgres connection URL')
}

exports.setup = (done) => {
  // Connect to postgres
  pg.connect(PG_URL, function(err, client) {
    if (err) throw err
    done(client)
  })
}
