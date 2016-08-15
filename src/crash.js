const mini = require('./mini')

exports.parsedCrash = (pg, id, cb) => {
  pg.query('SELECT * FROM dtl.crashes WHERE id = $1', [id], (err, results) => {
    mini.readAndParse(id, (s3err, minidump, metadata) => {
      var payload = {}
      if (!s3err) {
        minidump = minidump.toString()
        payload = {
          crash: results.rows[0],
          crash_report: minidump
        }
      }
      cb(s3err, payload)
    })
  })
}

export function storedCrash (pg, id, cb) {
  pg.query('SELECT * FROM dtl.crashes WHERE id = $1', [id], (err, results) => {
    mini.readSymbolized(id, (s3err, minidump) => {
      var payload = {}
      if (!s3err) {
        minidump = minidump.toString()
        payload = {
          crash: results.rows[0],
          crash_report: minidump
        }
      }
      cb(s3err, payload)
    })
  })
}
