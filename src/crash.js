const mini = require('./mini')

exports.parsedCrash = (pg, id, cb) => {
  pg.query('SELECT * FROM dtl.crashes WHERE id = $1', [id], (err, results) => {
    mini.readAndParse(id, (s3err, minidump, metadata) => {
      var payload = {}
      if (!s3err) {
        minidump = minidump.toString()
        payload = {
          crash: results.rows[0],
          crash_report: minidump,
          meta: metadata
        }
        console.log(metadata)
      }
      cb(s3err, payload)
    })
  })
}
