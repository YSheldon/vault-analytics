var csv = require('../csv-import')
var pgc = require('../pgc')

var fs = require('fs')

var args = require('yargs')
    .demand(['file', 'platform', 'version'])
    .argv

// Valid platform identifiers
var platforms = {
  'android': true,
  'ios': true
}

if (!platforms[args.platform]) {
  throw new Error('Invalid platform ' + args.platform)
}

// Read and parse input file, insert DAU into Postgres
pgc.setup(function (client) {
  var contents = fs.readFileSync(args.file, 'utf-8')
  csv.import(client, contents, args.platform, args.version, function (err) {
    console.log(err)
    client.end()
  })
})
