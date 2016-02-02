const model = require('./model')

const async = require('async')
const _ = require('underscore')

// Read in the contents of a CSV file, inserting elements into Postgres
exports.import = (client, contents, platform, version, done) => {
  // Split the rows and remove blank rows
  var rows = _.filter(contents.split('\n').slice(1), (row) => {
    return row.length
  })

  // Parse the rows into objects
  var results = _.map(rows, (row) => {
    var tokens = row.split(/,/)
    return {
      _id: {
        ymd: tokens[0],
        platform: platform,
        version: version,
        first_time: false
      },
      count: parseInt(tokens[1], 10)
    }
  })
  console.log(results)

  // Build upsert functions
  var funcs = _.map(results, (result) => model.usageUpserter(client, result))

  if (client) {
    async.series(funcs, done)
  } else {
    console.log('No database connection - ignoring update')
    done(null)
  }
}
